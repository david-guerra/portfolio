import { Github, Linkedin, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

const SocialItem = ({ icon: Icon, href, to, label }: { icon: any, href?: string, to?: string, label: string }) => {
    const classes = "flex items-center w-full p-3 bg-gruv-bg1 rounded-lg hover:bg-gruv-bg1/70 hover:text-gruv-yellow transition-colors group/item gap-3"
    const content = (
        <>
            <Icon className="w-5 h-5 text-gruv-blue group-hover/item:text-gruv-yellow transition-colors shrink-0" />
            <span className="text-sm font-mono text-gruv-fg/70 group-hover/item:text-gruv-fg">{label}</span>
        </>
    )

    if (to) {
        return <Link to={to} className={classes}>{content}</Link>
    }
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
            {content}
        </a>
    )
}

export function StackCard() {
    return (
        <div className="flex flex-col h-full justify-center gap-4">
            <SocialItem icon={Github} href={import.meta.env.VITE_GITHUB_URL} label="GitHub" />
            <SocialItem icon={Linkedin} href={import.meta.env.VITE_LINKEDIN_URL} label="LinkedIn" />
            <SocialItem icon={Mail} to="/contact" label="Email" />
        </div>
    )
}
