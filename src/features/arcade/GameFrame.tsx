import type { ReactNode } from 'react'
import SectionFrame from '../../components/SectionFrame.tsx'

interface GameFrameProps {
    title: string
    subtitle?: string
    status: ReactNode
    statusClassName?: string
    onBack: () => void
    sidebar: ReactNode
    actionZone?: ReactNode
    children: ReactNode
    mobileHelp: string
    footer: ReactNode
}

export default function GameFrame({
    title,
    subtitle,
    status,
    statusClassName = 'text-teal',
    onBack,
    sidebar,
    actionZone,
    children,
    mobileHelp,
    footer,
}: GameFrameProps) {
    return (
        <SectionFrame variant="wide" className="relative flex min-h-full flex-col wide:h-full">
            <button
                type="button"
                onClick={onBack}
                aria-label="Back to Arcade"
                className="inline-flex min-h-11 min-w-11 w-fit cursor-pointer items-center text-sm text-lavender focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange wide:absolute wide:top-0 wide:left-0 wide:z-10"
            >
                ← Back to Arcade
            </button>

            <div className="mt-5 grid min-h-0 flex-1 grid-cols-1 wide:mt-0 wide:grid-cols-[340px_minmax(0,1fr)] wide:grid-rows-[auto_minmax(0,1fr)_auto]">
                <div className="wide:col-start-1 wide:row-start-1 wide:border-r wide:border-border wide:pr-12">
                    <h2 className="text-2xl font-medium tracking-[0.04em] text-ink wide:mt-24 wide:text-heading">
                        {title}
                    </h2>
                    {subtitle ? <p className="mt-2 text-body-mono text-dim">{subtitle}</p> : null}
                    <div
                        aria-live="polite"
                        className={`mt-4 text-base tracking-[0.08em] wide:mt-8 ${statusClassName}`}
                    >
                        {status}
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col wide:col-start-2 wide:row-span-2 wide:row-start-1 wide:pl-12">
                    <div className="flex min-h-0 flex-1 items-center justify-center py-5 wide:py-0 wide:[container-type:size]">
                        {children}
                    </div>
                    <p className="pb-2 text-center text-[0.6875rem] text-muted wide:hidden">
                        {mobileHelp}
                    </p>
                </div>

                <aside
                    className={`mt-4 wide:col-start-1 wide:row-span-2 wide:row-start-2 wide:mt-0 wide:border-r wide:border-border wide:pr-12 wide:pt-8 ${
                        actionZone
                            ? ''
                            : 'pb-[calc(1rem+env(safe-area-inset-bottom))] wide:pb-0'
                    }`}
                >
                    {sidebar}
                </aside>

                {actionZone ? (
                    <div className="mt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] wide:col-start-2 wide:row-start-3 wide:mt-0 wide:pl-12 wide:pt-4 wide:pb-0">
                        {actionZone}
                    </div>
                ) : null}
            </div>

            <div className="mt-4 hidden shrink-0 border-t border-border pt-5 text-sm text-body wide:flex wide:gap-8">
                {footer}
            </div>
        </SectionFrame>
    )
}
