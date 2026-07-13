export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'theme'

export function resolveInitialTheme(stored: string | null): Theme {
    return stored === 'light' ? 'light' : 'dark'
}

export function toggleTheme(theme: Theme): Theme {
    return theme === 'dark' ? 'light' : 'dark'
}
