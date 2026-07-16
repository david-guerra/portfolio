import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

function classicWorkerCompatibility(): Plugin {
    return {
        name: 'classic-worker-compatibility',
        enforce: 'post',
        transform(code, id) {
            const queryIndex = id.indexOf('?')
            if (queryIndex === -1) return null

            const query = new URLSearchParams(id.slice(queryIndex + 1))
            if (!query.has('worker_file') || query.get('type') !== 'classic') return null

            // Vite preserves these workers' type-only exports as an empty ESM marker.
            // Emscripten's importScripts glue requires classic workers, where that marker is invalid.
            const classicCode = code.replace(/\nexport\s*\{\s*\};?\s*$/, '\n')
            return classicCode === code ? null : classicCode
        },
    }
}

export default defineConfig({
    plugins: [react(), tailwindcss(), classicWorkerCompatibility()],
    base: '/portfolio/',
})
