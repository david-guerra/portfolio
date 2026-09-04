export type NavSection = 'about' | 'projects' | 'arcade'
export type LaunchDestination = NavSection | 'contact' | 'home'

export interface SectionOffsets {
    about: number
    projects: number
    arcade: number
}

const NAV_SECTIONS: NavSection[] = ['about', 'projects', 'arcade']

const LEGACY_HASH_DESTINATIONS: Readonly<Record<string, LaunchDestination>> = {
    '#about': 'about',
    '#projects': 'projects',
    '#arcade': 'arcade',
    '#contact': 'contact',
    '#/': 'about',
    '#/about': 'about',
    '#/projects': 'projects',
    '#/arcade': 'arcade',
    '#/contact': 'contact',
    '#/blog': 'home',
}

export function legacyHashDestination(hash: string): LaunchDestination | null {
    return LEGACY_HASH_DESTINATIONS[hash.toLowerCase()] ?? null
}

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
