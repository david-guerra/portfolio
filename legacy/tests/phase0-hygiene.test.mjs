import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const generatedPaths = [
  'vite.config.js',
  'vite.config.d.ts',
  'test_life',
  'c_connect/test_connect',
]

test('generated configs and native test binaries are ignored and untracked', async () => {
  const ignore = await readFile('.gitignore', 'utf8')
  const tracked = execFileSync('git', ['ls-files', '--', ...generatedPaths], { encoding: 'utf8' }).trim()

  assert.equal(tracked, '')
  assert.match(ignore, /^\/vite\.config\.js$/m)
  assert.match(ignore, /^\/vite\.config\.d\.ts$/m)
  assert.match(ignore, /^\/test_life$/m)
  assert.match(ignore, /^\/c_connect\/test_connect$/m)
})

test('an ESLint flat configuration exists', async () => {
  const config = await readFile('eslint.config.js', 'utf8')
  assert.match(config, /typescript-eslint\/parser/)
  assert.match(config, /react-hooks/)
  assert.match(config, /react-refresh/)
})
