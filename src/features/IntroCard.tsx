import { BentoCard } from '../components/ui/BentoCard'

export function IntroCard({ className, colSpan }: { className?: string, colSpan?: number | string }) {
    return (
        <BentoCard className={className} colSpan={colSpan}>
            <div className="flex flex-col space-y-2 font-mono text-sm md:text-base">
                <p>
                    <span className="text-gruv-aqua mr-2">{">"}</span>
                    <span className="text-gruv-fg">Hi, I'm </span>
                    <span className="text-gruv-yellow font-bold typing-effect">David</span>
                </p>
                <p>
                    <span className="text-gruv-aqua mr-2">{">"}</span>
                    <span className="text-gruv-fg">A first year Computer Science Student</span>
                </p>
                <p>
                    <span className="text-gruv-aqua mr-2">{">"}</span>
                    <span className="text-gruv-fg">@ Hasso Plattner Institut</span>
                </p>
            </div>
        </BentoCard>
    )
}
