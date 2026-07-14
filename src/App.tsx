import { useLayoutEffect, useRef, useState } from 'react'
import Hero from './components/Hero.tsx'
import SiteNav from './components/SiteNav.tsx'
import AboutSection from './features/about/AboutSection.tsx'
import { activeSection, type NavSection } from './lib/sections.ts'
import { resolveInitialTheme, toggleTheme, THEME_STORAGE_KEY, type Theme } from './lib/theme.ts'

function readStoredTheme(): Theme {
    try {
        return resolveInitialTheme(localStorage.getItem(THEME_STORAGE_KEY))
    } catch {
        return 'dark'
    }
}

const renderedOffsets = (el: HTMLDivElement) => ({
    about: el.querySelector<HTMLElement>('#about')?.offsetTop ?? el.clientHeight,
    projects: el.querySelector<HTMLElement>('#projects')?.offsetTop ?? el.clientHeight * 2,
    arcade: el.querySelector<HTMLElement>('#arcade')?.offsetTop ?? el.clientHeight * 3,
})

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
        if (el) setActive(activeSection(el.scrollTop, el.clientHeight, renderedOffsets(el)))
    }

    const scrollToSection = (section: NavSection) => {
        const el = scrollerRef.current
        /* behavior comes from CSS scroll-behavior, so reduced motion turns smoothing off */
        const top = el?.querySelector<HTMLElement>(`#${section}`)?.offsetTop
        if (el && top !== undefined) el.scrollTo({ top })
    }

    const navigate = (section: NavSection) => scrollToSection(section)

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
                className="relative flex-1 scroll-smooth overflow-y-scroll [scrollbar-width:none] motion-reduce:scroll-auto wide:snap-y wide:snap-mandatory [&::-webkit-scrollbar]:hidden"
            >
                {/* Remaining pane contents land via their own tickets: Projects #12, Arcade #13. */}
                <section
                    id="hero"
                    className="relative min-h-full wide:h-full wide:snap-start wide:snap-always"
                >
                    <Hero theme={theme} onScrollNext={() => scrollToSection('about')} />
                </section>
                <AboutSection onScrollNext={() => scrollToSection('projects')} />
                <section
                    id="projects"
                    className="flex min-h-full flex-col justify-center px-5 wide:h-full wide:snap-start wide:snap-always wide:px-14"
                >
                    <p className="text-label uppercase text-muted">Projects</p>
                    <p className="mt-4 text-body-mono text-dim">Under construction.</p>
                </section>
                <section
                    id="arcade"
                    className="flex min-h-full flex-col justify-center px-5 wide:h-full wide:snap-start wide:snap-always wide:px-14"
                >
                    <p className="text-label uppercase text-muted">Arcade</p>
                    <p className="mt-4 text-body-mono text-dim">Under construction.</p>
                </section>
            </div>
        </div>
    )
}
