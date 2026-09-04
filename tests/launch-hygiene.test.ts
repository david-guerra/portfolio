import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import test from 'node:test'

test('the retired app contributes no package manifest to the repository', () => {
    assert.equal(
        existsSync('legacy/package-lock.json'),
        false,
        'legacy/package-lock.json keeps retired dependencies in Dependabot scope',
    )
    assert.equal(existsSync('legacy/package.json'), false)
})
