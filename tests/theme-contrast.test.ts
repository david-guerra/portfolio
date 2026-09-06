import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const css = readFileSync('src/index.css', 'utf8')

function declarations(selector: string): Map<string, string> {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const block = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1]
    assert.ok(block, `Expected a ${selector} token block`)

    return new Map(
        [...block.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((match) => [
            match[1],
            match[2],
        ]),
    )
}

function rgb(hex: string): readonly [number, number, number] {
    return [
        Number.parseInt(hex.slice(1, 3), 16),
        Number.parseInt(hex.slice(3, 5), 16),
        Number.parseInt(hex.slice(5, 7), 16),
    ]
}

function luminance(hex: string): number {
    const channels = rgb(hex).map((channel) => {
        const normalized = channel / 255
        return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(foreground: string, background: string): number {
    const foregroundLuminance = luminance(foreground)
    const backgroundLuminance = luminance(background)
    return (
        (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
        / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
    )
}

const root = declarations(':root')
const light = declarations('[data-theme="light"]')
const textTokens = [
    '--text-secondary',
    '--muted',
    '--orange',
    '--olive',
    '--lavender',
    '--teal',
] as const

for (const [theme, overrides] of [['dark', new Map<string, string>()], ['light', light]] as const) {
    const value = (token: string): string => {
        const resolved = overrides.get(token) ?? root.get(token)
        assert.ok(resolved, `${theme} theme has no ${token}`)
        return resolved
    }

    test(`${theme} functional colors meet WCAG AA on page and surface backgrounds`, () => {
        for (const backgroundToken of ['--bg', '--surface']) {
            for (const foregroundToken of textTokens) {
                const ratio = contrast(value(foregroundToken), value(backgroundToken))
                assert.ok(
                    ratio >= 4.5,
                    `${foregroundToken} on ${backgroundToken} is ${ratio.toFixed(2)}:1`,
                )
            }
        }
    })
}
