import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackButton } from './BackButton';

interface GameMenuProps {
    title: string;
    children: ReactNode;
    /** Unique key for the current content — drives the crossfade */
    contentKey: string;
    onBack: () => void;
    footerText?: string;
}

const contentVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2, delay: 0.05 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
};

export function GameMenu({
    title,
    children,
    contentKey,
    onBack,
    footerText = "[↑↓] SELECT   [ENTER] PLAY"
}: GameMenuProps) {
    return (
        <div className="flex-1 flex flex-col justify-center w-full">
            {/* Back button — always visible */}
            <div className="mb-2">
                <BackButton onClick={onBack} />
            </div>

            <div className="flex flex-col w-full overflow-hidden">
                {/* Header */}
                <div className="rounded-bento rounded-b-none border border-bento border-gruv-green py-4 text-center text-gruv-green text-sm font-mono bg-[#282828] z-20">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={title}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {title}
                        </motion.span>
                    </AnimatePresence>
                </div>

                {/* Content area — only this crossfades */}
                <div className="bg-[#282828] border-x border-bento border-gruv-green/0 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={contentKey}
                            className="flex flex-col justify-center space-y-4 py-8"
                            variants={contentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="rounded-bento rounded-t-none border border-bento border-gruv-green py-4 text-center text-gruv-green text-sm font-mono bg-[#282828] z-20">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={footerText}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {footerText}
                        </motion.span>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
