import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const budgetModule = await import('../scripts/check-performance-budget.ts').catch(() => null)

test('the launch bundle budget checker is available', () => {
    assert.ok(budgetModule, 'scripts/check-performance-budget.ts is missing')
})

test('the checker accepts assets inside the limit and rejects an oversized asset', () => {
    assert.ok(budgetModule)
    if (!budgetModule) return

    const root = mkdtempSync(join(tmpdir(), 'portfolio-budget-'))
    const assets = join(root, 'assets')
    mkdirSync(assets)
    writeFileSync(join(assets, 'index-fixture.js'), 'export const answer = 42\n')
    writeFileSync(join(assets, 'index-fixture.css'), 'html{color:#111}\n')

    try {
        const passing = budgetModule.checkPerformanceBudget(root, {
            javascript: 64,
            css: 64,
        })
        assert.deepEqual(passing.violations, [])

        const failing = budgetModule.checkPerformanceBudget(root, {
            javascript: 16,
            css: 16,
        })
        assert.deepEqual(
            failing.violations.map((violation: { kind: string }) => violation.kind),
            ['javascript', 'css'],
        )
    } finally {
        rmSync(root, { recursive: true, force: true })
    }
})
