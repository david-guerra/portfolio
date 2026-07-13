import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

function pngDimensions(buffer) {
  assert.equal(buffer.subarray(1, 4).toString('ascii'), 'PNG')
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

test('document metadata and base-aware assets are complete', async () => {
  const html = await readFile('index.html', 'utf8')

  assert.match(html, /%BASE_URL%favicon\.svg/)
  assert.match(html, /%BASE_URL%fonts\/JetBrainsMono-Variable\.woff2/)
  assert.match(html, /<title>David Guerra \| Software Builder<\/title>/)
  assert.match(html, /name="description"/)
  assert.match(html, /property="og:image"/)
  assert.match(html, /name="twitter:card" content="summary_large_image"/)
})

test('sharing and README images have intentional dimensions', async () => {
  const [og, preview] = await Promise.all([
    readFile('public/og-image.png'),
    readFile('public/portfolio-preview.png'),
  ])

  assert.deepEqual(pngDimensions(og), { width: 1200, height: 630 })
  assert.deepEqual(pngDimensions(preview), { width: 1440, height: 900 })
})

test('README explains the live project, architecture, and both build paths', async () => {
  const readme = await readFile('README.md', 'utf8')

  assert.match(readme, /https:\/\/david-guerra\.github\.io\/portfolio\//)
  assert.match(readme, /```mermaid/)
  assert.match(readme, /npm ci/)
  assert.match(readme, /npm run dev/)
  assert.match(readme, /emcc c_connect\/wasm_adapter\.c/)
  assert.match(readme, /WEB3FORMS_ACCESS_KEY/)
})
