import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('the Pages build receives the Web3Forms repository secret', async () => {
  const workflow = await readFile('.github/workflows/deploy.yml', 'utf8')

  assert.match(
    workflow,
    /VITE_WEB3FORMS_ACCESS_KEY:\s*\$\{\{\s*secrets\.WEB3FORMS_ACCESS_KEY\s*\}\}/,
  )
})
