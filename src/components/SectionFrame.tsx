import type { ReactNode } from 'react'

const FRAME_WIDTH: Record<SectionFrameVariant, string> = {
    wide: 'max-w-[1800px]',
    'external-wide': 'max-w-[1364px] min-[1800px]:max-w-[1800px]',
}

export type SectionFrameVariant = 'wide' | 'external-wide'

export interface SectionFrameProps {
    variant: SectionFrameVariant
    className?: string
    children: ReactNode
}

export default function SectionFrame({
    variant,
    className = '',
    children,
}: SectionFrameProps) {
    return (
        <div
            data-section-frame={variant}
            className={`mx-auto w-full ${FRAME_WIDTH[variant]} ${className}`.trim()}
        >
            {children}
        </div>
    )
}
