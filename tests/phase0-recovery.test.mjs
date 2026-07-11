import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('the not-found escape route stays inside React Router', async () => {
  const app = await readFile('src/App.tsx', 'utf8')

  assert.match(app, /import\s*\{[^}]*Link[^}]*\}\s*from\s*['"]react-router-dom['"]/s)
  assert.match(app, /<Link\s+to="\/"/)
  assert.doesNotMatch(app, /<a\s+href="\/"/)
})

test('Connect 4 exposes worker failure and retry states', async () => {
  const [hook, view] = await Promise.all([
    readFile('src/hooks/useGameBot.ts', 'utf8'),
    readFile('src/features/games/connect4/Connect4View.tsx', 'utf8'),
  ])

  assert.match(hook, /worker\.onerror\s*=/)
  assert.match(hook, /const retry = useCallback/)
  assert.match(hook, /return\s*\{[^}]*error[^}]*retry[^}]*\}/s)
  assert.match(view, /role="alert"/)
  assert.match(view, /BOT_INIT_FAILED/)
  assert.match(view, /onClick=\{retry\}/)
})
