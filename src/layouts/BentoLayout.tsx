import { Outlet } from 'react-router-dom'
import { BentoCard } from '../components/ui/BentoCard'
import { BreadcrumbHeader } from '../components/ui/BreadcrumbHeader'
import { IntroCard } from '../features/IntroCard'
import { ProjectNavCard } from '../features/navigation/ProjectNavCard'
import { StackCard } from '../features/StackCard'

// Placeholder for now, we will create these feature components next
export function BentoLayout() {
    return (
        <div className="min-h-screen md:h-screen md:max-h-screen bg-gruv-bg-hard text-gruv-fg font-mono p-6 md:p-8 flex items-start md:items-center justify-center md:overflow-hidden">
            <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-4 gap-bento-gap md:grid-rows-[auto_1fr_1fr]">

                {/* Top Full Width Intro */}
                <IntroCard colSpan="full" className="md:col-span-4" />

                {/* Left Column - Navigation */}
                {/* On mobile: 2nd position. On desktop: Row 2, Col 1 */}
                <BentoCard colSpan={1} className="md:flex-1 justify-between flex-1">
                    <ProjectNavCard />
                </BentoCard>

                {/* Right Large Box -- Dynamic Content */}
                {/* On mobile: 3rd position. On desktop: Row 2-3, Col 2-4 */}
                <BentoCard colSpan="full" rowSpan={2} className="md:col-span-3 md:row-span-2 h-full min-h-[500px] flex flex-col relative order-3 md:order-none">
                    <BreadcrumbHeader />
                    <div className="flex-1 overflow-y-auto">
                        <Outlet />
                    </div>
                </BentoCard>

                {/* Stack */}
                {/* On mobile: Last position (4th). On desktop: Row 3, Col 1 */}
                <BentoCard colSpan={1} className="order-4 md:order-none">
                    <StackCard />
                </BentoCard>

            </div>
        </div>
    )
}
