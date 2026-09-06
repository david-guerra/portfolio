import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

export interface PerformanceBudgets {
    javascript: number
    css: number
}

export interface BudgetResult {
    kind: keyof PerformanceBudgets
    path: string
    gzipBytes: number
    limitBytes: number
}

export const PERFORMANCE_BUDGET: Readonly<PerformanceBudgets> = Object.freeze({
    javascript: 100 * 1024,
    css: 16 * 1024,
})

const ENTRY_ASSETS: Readonly<Record<keyof PerformanceBudgets, RegExp>> = Object.freeze({
    javascript: /^index-[\w-]+\.js$/,
    css: /^index-[\w-]+\.css$/,
})

export function checkPerformanceBudget(
    distDirectory = 'dist',
    budgets: Readonly<PerformanceBudgets> = PERFORMANCE_BUDGET,
): { results: BudgetResult[], violations: BudgetResult[] } {
    const assetsDirectory = join(distDirectory, 'assets')
    const assetNames = readdirSync(assetsDirectory)
    const results = (Object.entries(ENTRY_ASSETS) as [keyof PerformanceBudgets, RegExp][])
        .map(([kind, pattern]) => {
            const assetName = assetNames.find((name) => pattern.test(name))
            if (!assetName) throw new Error(`No ${kind} entry asset found in ${assetsDirectory}`)

            return {
                kind,
                path: join(assetsDirectory, assetName),
                gzipBytes: gzipSync(readFileSync(join(assetsDirectory, assetName))).byteLength,
                limitBytes: budgets[kind],
            }
        })

    return {
        results,
        violations: results.filter((result) => result.gzipBytes > result.limitBytes),
    }
}

function kibibytes(bytes: number): string {
    return `${(bytes / 1024).toFixed(1)} KiB`
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const report = checkPerformanceBudget()
    for (const result of report.results) {
        console.log(
            `${result.kind}: ${kibibytes(result.gzipBytes)} gzip / ${kibibytes(result.limitBytes)} budget`,
        )
    }
    if (report.violations.length > 0) process.exitCode = 1
}
