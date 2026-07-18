import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('the Pages build receives the existing Web3Forms secret', () => {
    const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8')
    assert.match(
        workflow,
        /VITE_WEB3FORMS_ACCESS_KEY:\s*\$\{\{\s*secrets\.WEB3FORMS_ACCESS_KEY\s*\}\}/,
    )
})

test('Vite declares the contact configuration variable', () => {
    const declarations = readFileSync('src/vite-env.d.ts', 'utf8')
    assert.match(declarations, /readonly VITE_WEB3FORMS_ACCESS_KEY: string/)
})
