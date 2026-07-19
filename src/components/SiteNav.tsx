import { PROFILE_LINKS } from '../content/profile.ts'
import type { NavSection } from '../lib/sections.ts'
import type { Theme } from '../lib/theme.ts'

const NAV_ITEMS: ReadonlyArray<readonly [NavSection, string]> = [
    ['about', 'About'],
    ['projects', 'Projects'],
    ['arcade', 'Arcade'],
]

interface SiteNavProps {
    active: NavSection | null
    theme: Theme
    onNavigate: (section: NavSection) => void
    onToggleTheme: () => void
    /* Receives the trigger element so the contact dialog can restore focus to it. */
    onContact?: (trigger: HTMLElement) => void
}

export default function SiteNav({ active, theme, onNavigate, onToggleTheme, onContact }: SiteNavProps) {
    return (
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 wide:px-14 wide:py-[22px]">
            <nav aria-label="Sections" className="flex items-center gap-3 wide:gap-8">
                {NAV_ITEMS.map(([section, label]) => (
                    <button
                        key={section}
                        type="button"
                        onClick={() => onNavigate(section)}
                        aria-current={active === section ? 'true' : undefined}
                        className={`cursor-pointer text-xs whitespace-nowrap transition-colors hover:text-ink wide:text-sm ${
                            active === section ? 'text-ink' : 'text-dim'
                        }`}
                    >
                        {label}
                        <span
                            aria-hidden="true"
                            className={`mt-1 block h-0.5 bg-orange transition-opacity wide:mt-1.5 ${
                                active === section ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                    </button>
                ))}
            </nav>
            <div className="flex items-center gap-3 wide:gap-7">
                <a
                    href={PROFILE_LINKS.github}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                    className="text-xs whitespace-nowrap text-olive wide:text-sm"
                >
                    <span className="max-sm:hidden">GitHub ↗</span>
                    <span className="sm:hidden">GH ↗</span>
                    <span aria-hidden="true" className="mt-1 block h-px bg-olive wide:mt-1.5" />
                </a>
                <a
                    href={PROFILE_LINKS.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                    className="text-xs whitespace-nowrap text-olive wide:text-sm"
                >
                    <span className="max-sm:hidden">LinkedIn ↗</span>
                    <span className="sm:hidden">in ↗</span>
                    <span aria-hidden="true" className="mt-1 block h-px bg-olive wide:mt-1.5" />
                </a>
                <button
                    type="button"
                    onClick={(event) => onContact?.(event.currentTarget)}
                    className="cursor-pointer rounded-chip border border-orange px-2.5 py-1 text-xs text-orange transition-colors hover:bg-orange hover:text-bg wide:px-3.5 wide:py-1.5 wide:text-sm"
                >
                    Contact
                </button>
                <button
                    type="button"
                    onClick={onToggleTheme}
                    aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    className="cursor-pointer text-sm text-muted transition-colors hover:text-ink"
                >
                    {theme === 'dark' ? '◐' : '◑'}
                </button>
            </div>
        </header>
    )
}
