export type NavSection = 'about' | 'projects' | 'arcade'

// Snap panes in scroll order; hero and the About body both belong to About.
const PANE_SECTIONS: NavSection[] = ['about', 'about', 'projects', 'arcade']

export function activeSection(scrollTop: number, viewportHeight: number): NavSection {
    if (viewportHeight <= 0) return 'about'
    const pane = Math.min(
        PANE_SECTIONS.length - 1,
        Math.max(0, Math.round(scrollTop / viewportHeight)),
    )
    return PANE_SECTIONS[pane]
}

export function sectionTargetIndex(section: NavSection): number {
    return { about: 0, projects: 2, arcade: 3 }[section]
}
