import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync('index.html', 'utf8')
const imageUrl = 'https://david-guerra.github.io/portfolio/og-image.png'
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function metaContent(attribute: 'name' | 'property', value: string): string {
    const tag = html.match(new RegExp(`<meta\\s+${attribute}="${value}"\\s+content="([^"]+)"\\s*/?>`))
    assert.ok(tag, `index.html carries no ${attribute}="${value}" metadata`)
    return tag[1]
}

function socialCardDimensions(): readonly [number, number] {
    const header = readFileSync('public/og-image.png').subarray(0, 24)
    assert.equal(header.length, 24, 'og-image.png has no complete PNG header')
    assert.deepEqual(header.subarray(0, 8), pngSignature, 'og-image.png is not a PNG')
    assert.equal(header.toString('ascii', 12, 16), 'IHDR', 'og-image.png has no IHDR chunk')
    return [header.readUInt32BE(16), header.readUInt32BE(20)]
}

test('the active page publishes its 1200x630 image as a large social card', () => {
    assert.equal(metaContent('property', 'og:image'), imageUrl)
    assert.equal(metaContent('name', 'twitter:image'), imageUrl)
    assert.equal(metaContent('name', 'twitter:card'), 'summary_large_image')
    assert.equal(metaContent('property', 'og:image:width'), '1200')
    assert.equal(metaContent('property', 'og:image:height'), '630')
    assert.deepEqual(socialCardDimensions(), [1200, 630])
})
