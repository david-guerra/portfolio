export type NavSection = 'about' | 'projects' | 'arcade'

// Snap panes in scroll order; the hero is a landing pane and belongs to no nav item.
const PANE_SECTIONS: Array<NavSection | null> = [null, 'about', 'projects', 'arcade']

export function activeSection(scrollTop: number, viewportHeight: number): NavSection | null {
    if (viewportHeight <= 0) return null
    const pane = Math.min(
        PANE_SECTIONS.length - 1,
        Math.max(0, Math.round(scrollTop / viewportHeight)),
    )
    return PANE_SECTIONS[pane]
}

export function sectionTargetIndex(section: NavSection): number {
    return { about: 1, projects: 2, arcade: 3 }[section]
}
