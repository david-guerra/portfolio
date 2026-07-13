import { useEffect, useRef, useState } from 'react'
import SiteNav from './components/SiteNav.tsx'
import { activeSection, sectionTargetIndex, type NavSection } from './lib/sections.ts'
import { resolveInitialTheme, toggleTheme, THEME_STORAGE_KEY, type Theme } from './lib/theme.ts'

function readStoredTheme(): Theme {
    try {
        return resolveInitialTheme(localStorage.getItem(THEME_STORAGE_KEY))
    } catch {
        return 'dark'
    }
}

export default function App() {
    const [theme, setTheme] = useState<Theme>(readStoredTheme)
    const [active, setActive] = useState<NavSection | null>(null)
    const scrollerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        document.documentElement.dataset.theme = theme
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme)
        } catch {
            /* storage blocked: theme still applies for this visit */
        }
    }, [theme])

    const handleScroll = () => {
        const el = scrollerRef.current
        if (el) setActive(activeSection(el.scrollTop, el.clientHeight))
    }

    const scrollToPane = (pane: number) => {
        const el = scrollerRef.current
        /* behavior comes from CSS scroll-behavior, so reduced motion turns smoothing off */
        el?.scrollTo({ top: pane * el.clientHeight })
    }

    const navigate = (section: NavSection) => scrollToPane(sectionTargetIndex(section))

    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <SiteNav
                active={active}
                theme={theme}
                onNavigate={navigate}
                onToggleTheme={() => setTheme(toggleTheme)}
            />
            <div
                ref={scrollerRef}
                onScroll={handleScroll}
                className="flex-1 snap-y snap-mandatory scroll-smooth overflow-y-scroll [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
            >
                {/* Pane contents land via their own tickets: hero #10, About #11,
                    Projects #12, Arcade #13. This ticket ships the shell. */}
                <section id="hero" className="relative h-full snap-start snap-always">
                    <div className="absolute bottom-20 left-5 wide:bottom-14 wide:left-14">
                        <h1 className="text-[34px] font-bold tracking-tight text-ink">David Guerra</h1>
                        <p className="mt-2.5 text-base text-body">
                            I build things to understand how they work.
                        </p>
                        <p className="mt-3.5 flex items-center gap-2.5 text-meta">
                            <span aria-hidden="true" className="size-[7px] rounded-dot bg-olive" />
                            <span className="text-teal">IT-Systems Engineering</span>
                            <span className="text-dim">· Berlin</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => scrollToPane(1)}
                        className="absolute right-5 bottom-8 cursor-pointer text-meta text-muted transition-colors hover:text-body wide:right-14 wide:bottom-14"
                    >
                        scroll <span className="text-[15px]">↓</span>
                    </button>
                </section>
                <section id="about" className="flex h-full snap-start snap-always flex-col justify-center px-5 wide:px-14">
                    <p className="text-label uppercase text-muted">About</p>
                    <p className="mt-4 text-body-mono text-dim">Under construction.</p>
                </section>
                <section id="projects" className="flex h-full snap-start snap-always flex-col justify-center px-5 wide:px-14">
                    <p className="text-label uppercase text-muted">Projects</p>
                    <p className="mt-4 text-body-mono text-dim">Under construction.</p>
                </section>
                <section id="arcade" className="flex h-full snap-start snap-always flex-col justify-center px-5 wide:px-14">
                    <p className="text-label uppercase text-muted">Arcade</p>
                    <p className="mt-4 text-body-mono text-dim">Under construction.</p>
                </section>
            </div>
        </div>
    )
}
