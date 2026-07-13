export default function App() {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#0d0d0f] px-6 font-mono text-[#e4e0d6]">
            <p className="text-xs tracking-[0.3em] text-[#e8734a] uppercase">
                Under construction
            </p>
            <h1 className="text-center text-2xl tracking-widest text-[#f3e9d2] uppercase sm:text-4xl">
                David Guerra
            </h1>
            <p className="max-w-md text-center text-sm leading-relaxed text-[#e4e0d6]/70">
                A new portfolio is being built here — pixel-canvas hero, projects,
                and a playable C/WebAssembly arcade.
            </p>
            <a
                href="https://github.com/david-guerra"
                className="border border-[#e4e0d6]/30 px-4 py-2 text-xs tracking-[0.2em] uppercase transition-colors hover:border-[#e8734a] hover:text-[#e8734a]"
            >
                GitHub ↗
            </a>
        </main>
    )
}
