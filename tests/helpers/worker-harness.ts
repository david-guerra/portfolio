// Boots one of the classic web workers under Node's test runner by shimming
// the worker globals it touches: `self`, `importScripts`, and `fetch`.
// The Emscripten glue and .wasm binaries are the real shipped artifacts in
// public/wasm/, so these tests exercise the actual C engines end-to-end.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

export type WorkerMessage = { type: string; payload?: unknown }

interface FakeWorkerScope {
    onmessage: ((e: { data: WorkerMessage }) => unknown) | null
    postMessage: (msg: unknown) => void
    location: { href: string }
}

export interface WorkerHarness {
    /** Every message the worker has posted so far. */
    all: WorkerMessage[]
    /** Dispatch one message to the worker; resolves with the messages it emitted in response. */
    send(msg: WorkerMessage): Promise<WorkerMessage[]>
}

let workerImportSerial = 0

/** Absolute path to a shipped Emscripten glue file, as passed in INIT payloads. */
export function wasmUrl(glueFile: string): string {
    return resolve(repoRoot, 'public', 'wasm', glueFile)
}

export async function bootWorker(workerRelPath: string): Promise<WorkerHarness> {
    const all: WorkerMessage[] = []
    const scope: FakeWorkerScope = {
        onmessage: null,
        postMessage: (msg) => {
            all.push(msg as WorkerMessage)
        },
        location: { href: pathToFileURL(resolve(repoRoot, 'public', 'wasm') + '/').href },
    }

    const g = globalThis as unknown as Record<string, unknown>
    g.self = scope
    // Newer Emscripten glues detect Node via globalThis.process and read the
    // .wasm through require("fs") from __dirname; satisfy both under ESM.
    g.require = createRequire(import.meta.url)
    g.__dirname = resolve(repoRoot, 'public', 'wasm')
    // The workers importScripts() the glue by absolute path; evaluate it in
    // global scope so its `createXModule` factory becomes a global, exactly
    // as importScripts would in a real worker.
    g.importScripts = (url: string) => {
        (0, eval)(readFileSync(url, 'utf8'))
    }
    // The glue fetches its .wasm relative to the INIT wasmUrl; serve local
    // files, pass anything else through.
    const realFetch = globalThis.fetch
    g.fetch = async (input: unknown, init?: unknown) => {
        const url = String(input)
        if (url.startsWith('/') || url.startsWith('file:')) {
            const path = url.startsWith('file:') ? fileURLToPath(url) : url
            return new Response(readFileSync(path), {
                headers: { 'Content-Type': 'application/wasm' },
            })
        }
        return realFetch(input as Parameters<typeof fetch>[0], init as Parameters<typeof fetch>[1])
    }

    const workerUrl = pathToFileURL(resolve(repoRoot, workerRelPath))
    workerUrl.searchParams.set('worker-harness-run', String(workerImportSerial))
    workerImportSerial += 1
    await import(workerUrl.href)

    if (!scope.onmessage) {
        throw new Error(`${workerRelPath} did not register self.onmessage`)
    }

    return {
        all,
        async send(msg) {
            const before = all.length
            await scope.onmessage!.call(scope, { data: msg })
            return all.slice(before)
        },
    }
}
