import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

function filesBelow(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name)
        return entry.isDirectory() ? filesBelow(path) : [path]
    })
}

test('the Pages build does not receive a third-party contact secret', () => {
    const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8')
    assert.doesNotMatch(
        workflow,
        /VITE_WEB3FORMS_ACCESS_KEY|WEB3FORMS_ACCESS_KEY/i,
    )
})

test('the app carries no Web3Forms or hCaptcha code, configuration, or dependency', () => {
    const packageFiles = [
        readFileSync('package.json', 'utf8'),
        readFileSync('package-lock.json', 'utf8'),
    ].join('\n')
    const declarations = readFileSync('src/vite-env.d.ts', 'utf8')
    const source = filesBelow('src')
        .map((path) => readFileSync(path, 'utf8'))
        .join('\n')

    assert.doesNotMatch(packageFiles, /web3forms|hcaptcha/i)
    assert.doesNotMatch(declarations, /VITE_WEB3FORMS_ACCESS_KEY/i)
    assert.doesNotMatch(source, /web3forms|hcaptcha|VITE_WEB3FORMS_ACCESS_KEY/i)
})
