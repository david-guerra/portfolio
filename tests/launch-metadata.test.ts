import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync('index.html', 'utf8')
const canonicalUrl = 'https://david-guerra.github.io/portfolio/'

function metaContent(name: string): string {
    const match = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]+)"\\s*/?>`))
    assert.ok(match, `index.html carries no name="${name}" metadata`)
    return match[1]
}

test('the document exposes complete indexable launch metadata', () => {
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]
    const description = metaContent('description')

    assert.equal(title, 'David Guerra | Software Builder')
    assert.ok(description.length >= 50 && description.length <= 160)
    assert.match(html, new RegExp(`<link\\s+rel="canonical"\\s+href="${canonicalUrl}"\\s*/?>`))
    assert.equal(metaContent('robots'), 'index, follow')
    assert.equal(metaContent('theme-color'), '#0d0d0f')
    assert.match(html, /<link\s+rel="icon"\s+type="image\/svg\+xml"\s+href="%BASE_URL%favicon\.svg"\s*\/?>/)
})

test('robots and sitemap publish the one canonical page', () => {
    assert.equal(existsSync('public/robots.txt'), true)
    assert.equal(existsSync('public/sitemap.xml'), true)
    if (!existsSync('public/robots.txt') || !existsSync('public/sitemap.xml')) return

    const robots = readFileSync('public/robots.txt', 'utf8')
    const sitemap = readFileSync('public/sitemap.xml', 'utf8')
    assert.match(robots, /User-agent:\s*\*\s+Allow:\s*\//)
    assert.match(robots, /Sitemap:\s*https:\/\/david-guerra\.github\.io\/portfolio\/sitemap\.xml/)
    assert.match(sitemap, new RegExp(`<loc>${canonicalUrl}<\\/loc>`))
})
