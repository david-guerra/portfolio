import { useLayoutEffect, useRef, useState } from 'react'
import Hero from './components/Hero.tsx'
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

    /* Layout effect: children (the hero canvas) sample CSS tokens in their own
       effects, which run before a parent passive effect would apply the theme. */
    useLayoutEffect(() => {
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
                {/* Pane contents land via their own tickets: About #11,
                    Projects #12, Arcade #13. */}
                <section id="hero" className="relative h-full snap-start snap-always">
                    <Hero theme={theme} onScrollNext={() => scrollToPane(1)} />
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
