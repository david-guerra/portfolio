import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface BentoCardProps {
    children: ReactNode
    className?: string
    colSpan?: number | string // e.g. "col-span-1" or 1
    rowSpan?: number | string
    title?: string
}

export function BentoCard({
    children,
    className,
    colSpan = 1,
    rowSpan = 1,
    title
}: BentoCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "bg-gruv-bg-soft border-2 border-bento rounded-bento p-6 flex flex-col overflow-hidden relative group",
                typeof colSpan === 'number' ? `md:col-span-${colSpan}` : colSpan,
                typeof rowSpan === 'number' ? `md:row-span-${rowSpan}` : rowSpan,
                className
            )}
        >
            {title && (
                <div className="mb-4">
                    <h3 className="text-gruv-fg font-bold text-lg tracking-tight">{title}</h3>
                </div>
            )}
            {children}
        </motion.div>
    )
}
