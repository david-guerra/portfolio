import { useLocation, Link, matchRoutes } from 'react-router-dom'
import { cn } from '../../lib/utils'

// Define the valid routes structure for matching
const routes = [
    { path: '/' },
    { path: '/about' },
    { path: '/arcade' },
    { path: '/projects' },
    { path: '/blog' },
    { path: '/contact' }
]

export function BreadcrumbHeader() {
    const location = useLocation()
    const pathSegments = location.pathname.split('/').filter(Boolean)

    // Check if the current full path matches any of our defined routes
    const isKnownRoute = matchRoutes(routes, location) !== null

    const breadcrumbs = [
        { name: '~', path: '/' },
        { name: 'david', path: '/' },
        ...(isKnownRoute
            ? pathSegments.map((segment, index) => ({
                name: segment,
                path: `/${pathSegments.slice(0, index + 1).join('/')}`
            }))
            : [{ name: '404', path: location.pathname }]
        )
    ]

    return (
        <div className="flex items-center space-x-2 text-sm md:text-base text-gruv-fg/60 mb-2 font-mono">
            {breadcrumbs.map((item, index) => (
                <div key={item.path + index} className="flex items-center">
                    {index > 0 && <span className="mx-2 text-gruv-fg/40">/</span>}
                    <Link
                        to={item.path}
                        className={cn(
                            "hover:text-gruv-yellow transition-colors duration-200",
                            index === breadcrumbs.length - 1 ? "text-gruv-yellow font-bold" : ""
                        )}
                    >
                        {item.name}
                    </Link>
                </div>
            ))}
            <span className="animate-pulse ml-1 inline-block w-2.5 h-4 bg-gruv-yellow/50 align-middle"></span>
        </div>
    )
}
