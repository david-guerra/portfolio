import { Link, useLocation } from 'react-router-dom'
import { Folder, Mail, File } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
    { name: './profile', path: '/', icon: File },
    { name: 'arcade/', path: '/arcade', icon: Folder },
    { name: 'projects/', path: '/projects', icon: Folder },
    { name: 'blog/', path: '/blog', icon: Folder },
    { name: './contact', path: '/contact', icon: Mail },
]

export function ProjectNavCard() {
    const location = useLocation()

    return (
        <div className="flex flex-col space-y-4">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
                const Icon = item.icon
                return (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                            "flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 group",
                            isActive ? "bg-gruv-bg1 shadow-sm" : "hover:bg-gruv-bg1/40"
                        )}
                    >
                        <Icon className={cn(
                            "w-5 h-5",
                            isActive ? "text-gruv-yellow" : "text-gruv-fg/50 group-hover:text-gruv-yellow"
                        )} />
                        <span className={cn(
                            "font-medium",
                            isActive ? "text-gruv-yellow" : "text-gruv-fg/70 group-hover:text-gruv-fg"
                        )}>
                            {item.name}
                        </span>
                    </Link>
                )
            })}
        </div>
    )
}
