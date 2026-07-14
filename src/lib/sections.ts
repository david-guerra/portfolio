export type NavSection = 'about' | 'projects' | 'arcade'

export interface SectionOffsets {
    about: number
    projects: number
    arcade: number
}

const NAV_SECTIONS: NavSection[] = ['about', 'projects', 'arcade']

function equalPaneOffsets(viewportHeight: number): SectionOffsets {
    return {
        about: viewportHeight,
        projects: viewportHeight * 2,
        arcade: viewportHeight * 3,
    }
}

export function activeSection(
    scrollTop: number,
    viewportHeight: number,
    offsets: SectionOffsets = equalPaneOffsets(viewportHeight),
): NavSection | null {
    if (viewportHeight <= 0) return null

    const viewportCenter = Math.max(0, scrollTop) + viewportHeight / 2
    let active: NavSection | null = null

    for (const section of NAV_SECTIONS) {
        if (viewportCenter < offsets[section]) break
        active = section
    }

    return active
}
