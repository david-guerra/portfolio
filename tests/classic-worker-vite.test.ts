import assert from 'node:assert/strict'
import { Script } from 'node:vm'
import { test } from 'node:test'
import { createServer } from 'vite'

const CLASSIC_WORKERS = [
    'bot.worker.ts',
    'sudoku.worker.ts',
    'gol.worker.ts',
] as const

test('Vite serves every classic worker as a valid classic script', async () => {
    const server = await createServer({
        appType: 'custom',
        logLevel: 'silent',
        optimizeDeps: { include: [], noDiscovery: true },
        server: { hmr: false, middlewareMode: true, watch: null, ws: false },
    })

    try {
        for (const worker of CLASSIC_WORKERS) {
            const result = await server.environments.client.transformRequest(
                `/src/workers/${worker}?worker_file&type=classic`,
            )

            assert.ok(result, `${worker} should be transformed`)
            assert.doesNotThrow(
                () => new Script(result.code, { filename: worker }),
                `${worker} must not contain ESM-only syntax`,
            )
        }
    } finally {
        await server.close()
    }
})
