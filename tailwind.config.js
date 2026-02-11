/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                gruv: {
                    bg: '#282828',
                    'bg-soft': '#282828',
                    fg: '#ebdbb2',
                    red: '#fb4934',
                    green: '#b8bb26',
                    yellow: '#fabd2f',
                    blue: '#83a598',
                    purple: '#d3869b',
                    aqua: '#8ec07c',
                    orange: '#fe8019',
                }
            },
            fontFamily: {
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            borderRadius: {
                'bento': '1.5rem', // Customizable radius (e.g. 24px)
            },
            spacing: {
                'bento-gap': '1rem', // Customizable grid gap
            },
            borderColor: {
                'bento': '#665c54', // Customizable border color
            },
            borderWidth: {
                '3': '3px', // Explicit thicker border if needed, but standardizing to 2px default via class
            },
            gridTemplateColumns: {
                'bento-md': 'repeat(4, minmax(0, 1fr))', // Standard 4-column bento grid
            }
        },
    },
    plugins: [],
}
