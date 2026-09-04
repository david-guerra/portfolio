import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const css = readFileSync('src/index.css', 'utf8')

test('reduced-motion visitors receive no smooth scrolling or decorative transitions', () => {
    const rule = css.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]+)\}\s*$/)?.[1]
    assert.ok(rule, 'the stylesheet has no reduced-motion override')
    assert.match(rule, /scroll-behavior:\s*auto\s*!important/)
    assert.match(rule, /animation-duration:\s*0\.01ms\s*!important/)
    assert.match(rule, /animation-iteration-count:\s*1\s*!important/)
    assert.match(rule, /transition-duration:\s*0\.01ms\s*!important/)
})
