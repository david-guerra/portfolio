import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('the intended local font and favicon exist', async () => {
  const [font, license, favicon] = await Promise.all([
    readFile('public/fonts/JetBrainsMono-Variable.woff2'),
    readFile('public/fonts/OFL.txt', 'utf8'),
    readFile('public/favicon.svg', 'utf8'),
  ])

  assert.equal(font.subarray(0, 4).toString('ascii'), 'wOF2')
  assert.match(license, /SIL OPEN FONT LICENSE/i)
  assert.match(favicon, /<svg[\s>]/)
  assert.match(favicon, />DG</)
})

test('Gruvbox depth and both missing animations are defined', async () => {
  const [css, tailwind, intro, layout] = await Promise.all([
    readFile('src/index.css', 'utf8'),
    readFile('tailwind.config.js', 'utf8'),
    readFile('src/features/IntroCard.tsx', 'utf8'),
    readFile('src/layouts/BentoLayout.tsx', 'utf8'),
  ])

  assert.match(css, /@font-face/)
  assert.match(css, /JetBrainsMono-Variable\.woff2/)
  assert.match(css, /prefers-reduced-motion:\s*reduce/)
  assert.match(tailwind, /'bg-hard':\s*'#1d2021'/)
  assert.match(tailwind, /'bg-soft':\s*'#32302f'/)
  assert.match(tailwind, /typing:\s*\{/)
  assert.match(tailwind, /fadeIn:\s*\{/)
  assert.match(tailwind, /'typing-effect':/)
  assert.match(tailwind, /'fade-in':/)
  assert.match(intro, /animate-typing-effect/)
  assert.match(layout, /bg-gruv-bg-hard/)
})
