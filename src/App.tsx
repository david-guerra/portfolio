import { useLayoutEffect, useRef, useState } from 'react'
import Hero from './components/Hero.tsx'
import SiteNav from './components/SiteNav.tsx'
import AboutSection from './features/about/AboutSection.tsx'
import ArcadeSection from './features/arcade/ArcadeSection.tsx'
import ProjectsSection from './features/projects/ProjectsSection.tsx'
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
        const target = el?.querySelector<HTMLElement>(`#${section}`)
        if (el && target) {
            setActive(section)
            el.scrollTo({ top: target.offsetTop })
            target.focus({ preventScroll: true })
        }
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
                <section
                    id="hero"
                    className="relative min-h-full wide:h-full wide:snap-start wide:snap-always"
                >
                    <Hero theme={theme} onScrollNext={() => scrollToSection('about')} />
                </section>
                <AboutSection onScrollNext={() => scrollToSection('projects')} />
                <ProjectsSection onScrollNext={() => scrollToSection('arcade')} />
                <ArcadeSection
                    theme={theme}
                    keyboardActive={active === 'arcade'}
                    onReturn={() => scrollToSection('projects')}
                />
            </div>
        </div>
    )
}
