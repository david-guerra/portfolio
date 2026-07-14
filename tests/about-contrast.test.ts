import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const MINIMUM_CONTRAST = 4.5
const ABOUT_TEXT_ROLES = [
    '--about-muted-text',
    '--about-orange-text',
    '--about-olive-text',
    '--about-lavender-text',
    '--about-teal-text',
] as const

function relativeLuminance(hex: string): number {
    const channels = hex
        .slice(1)
        .match(/.{2}/g)
        ?.map((channel) => Number.parseInt(channel, 16) / 255)
        .map((channel) =>
            channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
        )

    assert.ok(channels && channels.length === 3, `Expected a six-digit hex color, received ${hex}`)
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(foreground: string, background: string): number {
    const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
    const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
    return (lighter + 0.05) / (darker + 0.05)
}

test('light About text roles meet WCAG AA contrast against the real theme background', () => {
    const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
    const lightBlock = css.match(/\[data-theme="light"\]\s*\{([\s\S]*?)\n\}/)?.[1]
    assert.ok(lightBlock, 'Expected a [data-theme="light"] block in src/index.css')

    const tokens = Object.fromEntries(
        [...lightBlock.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map((match) => [
            match[1],
            match[2],
        ]),
    )
    const background = tokens['--bg']
    assert.ok(background, 'Expected the light theme to define --bg as a six-digit hex color')

    for (const role of ABOUT_TEXT_ROLES) {
        const foreground = tokens[role]
        assert.ok(foreground, `Expected the light theme to define ${role}`)
        const ratio = contrastRatio(foreground, background)
        assert.ok(
            ratio >= MINIMUM_CONTRAST,
            `${role} contrast ${ratio.toFixed(2)}:1 is below ${MINIMUM_CONTRAST}:1`,
        )
    }
})
