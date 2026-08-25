import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync('index.html', 'utf8')
const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8')

function policy(): string {
    const meta = html.match(
        /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/,
    )
    assert.ok(meta, 'index.html carries no Content-Security-Policy meta tag')
    return meta[1]
}

function directive(name: string): string[] {
    const found = policy()
        .split(';')
        .map((part) => part.trim())
        .find((part) => part === name || part.startsWith(`${name} `))
    assert.ok(found, `the policy declares no ${name} directive`)
    return found.split(/\s+/).slice(1)
}

function inlineScripts(): string[] {
    return [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)]
        .map((match) => match[1])
}

/* GitHub Pages sends no response headers of its own, so the policy has to ride
   in the document. Directives a meta tag cannot carry (frame-ancestors) are
   out of reach entirely — see the security notes on issue #27. */
test('the page carries a locked-down Content Security Policy', () => {
    assert.deepEqual(directive('default-src'), ["'none'"])
    assert.deepEqual(directive('base-uri'), ["'none'"])
    assert.deepEqual(directive('form-action'), ["'none'"])
    assert.deepEqual(directive('connect-src'), ["'self'"])
    assert.deepEqual(directive('font-src'), ["'self'"])
    assert.deepEqual(directive('worker-src'), ["'self'"])
    assert.deepEqual(directive('img-src'), ["'self'", 'data:'])
})

test('the policy admits WebAssembly without admitting eval or inline script', () => {
    const scriptSrc = directive('script-src')
    assert.ok(scriptSrc.includes("'self'"))
    assert.ok(
        scriptSrc.includes("'wasm-unsafe-eval'"),
        'the three C/WASM games need wasm-unsafe-eval',
    )
    assert.ok(!scriptSrc.includes("'unsafe-eval'"))
    assert.ok(!scriptSrc.includes("'unsafe-inline'"))
})

/* Inline styles are React style props; an injected <style> element stays blocked. */
test('inline style is allowed as an attribute only, never as an element', () => {
    assert.deepEqual(directive('style-src-elem'), ["'self'"])
    assert.deepEqual(directive('style-src-attr'), ["'unsafe-inline'"])
})

test('every inline script is allow-listed by its own hash', () => {
    const scriptSrc = directive('script-src')
    const scripts = inlineScripts()
    assert.ok(scripts.length > 0, 'expected the theme pre-paint script')
    for (const script of scripts) {
        const hash = createHash('sha256').update(script, 'utf8').digest('base64')
        assert.ok(
            scriptSrc.includes(`'sha256-${hash}'`),
            `an inline script is not allow-listed; add 'sha256-${hash}' to script-src`,
        )
    }
})

test('every workflow action is pinned to a full commit SHA', () => {
    const uses = [...workflow.matchAll(/uses:\s*(\S+)/g)].map((match) => match[1])
    assert.ok(uses.length > 0)
    for (const step of uses) {
        assert.match(
            step,
            /@[0-9a-f]{40}$/,
            `${step} is pinned to a movable tag, not a commit`,
        )
    }
})

test('the workflow keeps its token out of the checked-out git config', () => {
    assert.match(workflow, /persist-credentials:\s*false/)
})

test('the workflow reads by default and writes only where it deploys', () => {
    const [topLevel] = workflow.split('jobs:')
    assert.match(topLevel, /permissions:\s*\n\s+contents:\s*read/)
    assert.doesNotMatch(topLevel, /write/)
})

test('CI installs dependencies without running their lifecycle scripts', () => {
    assert.match(workflow, /npm ci --ignore-scripts/)
})
