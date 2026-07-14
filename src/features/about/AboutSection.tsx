const FOCUS_RING =
    'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange'

export interface AboutSectionProps {
    onSayHello?: () => void
    onScrollNext: () => void
}

export default function AboutSection({ onSayHello, onScrollNext }: AboutSectionProps) {
    return (
        <section
            id="about"
            aria-labelledby="about-heading"
            className="h-full snap-start snap-always overflow-y-auto px-5 py-8 wide:px-14 wide:py-20"
        >
            <div className="mx-auto flex min-h-full w-full max-w-[1364px] flex-col">
                <div className="grid wide:grid-cols-12 wide:gap-x-10">
                    <div className="wide:col-span-9">
                        <p className="text-label tracking-[0.12em] text-muted uppercase">About</p>
                        <h2
                            id="about-heading"
                            className="mt-8 max-w-[960px] font-sans text-display text-ink"
                        >
                            Somewhere between systems and products.
                        </h2>
                    </div>

                    <p className="mt-10 max-w-[640px] font-sans text-body-sans text-body wide:col-span-5 wide:col-start-1 wide:mt-14">
                        I study IT-Systems Engineering at the{' '}
                        <a
                            href="https://hpi.de/en/studies/it-systems-engineering-bsc/"
                            target="_blank"
                            rel="noreferrer"
                            className={`text-lavender underline decoration-lavender/70 underline-offset-4 transition-colors hover:text-olive ${FOCUS_RING}`}
                        >
                            Hasso Plattner Institute
                        </a>{' '}
                        and work at Siemens, building productivity tools for project management
                        with <span className="text-orange">SPFx</span> and{' '}
                        <span className="text-teal">Microsoft Power Platform</span>.
                    </p>

                    <div className="mt-8 wide:col-span-6 wide:col-start-7 wide:mt-24">
                        <p className="max-w-[640px] font-sans text-body-sans text-body">
                            I keep drifting toward systems and low-level details, while my work
                            shows me how much product context changes an engineering problem. I’m
                            now exploring where AI fits into internal workflows, with{' '}
                            <span className="text-olive">AI product engineering</span> as the
                            direction I want to grow toward.
                        </p>

                        <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-4 text-sm">
                            <button
                                type="button"
                                onClick={onSayHello}
                                className={`cursor-pointer border-b border-orange pb-1 text-orange transition-colors hover:text-ink ${FOCUS_RING}`}
                            >
                                Say hello →
                            </button>
                            <a
                                href="https://github.com/david-guerra"
                                target="_blank"
                                rel="noreferrer"
                                className={`border-b border-olive pb-1 text-olive transition-colors hover:text-ink ${FOCUS_RING}`}
                            >
                                GitHub ↗
                            </a>
                            <a
                                href="https://linkedin.com/in/david-guerrasal"
                                target="_blank"
                                rel="noreferrer"
                                className={`border-b border-olive pb-1 text-olive transition-colors hover:text-ink ${FOCUS_RING}`}
                            >
                                LinkedIn ↗
                            </a>
                        </div>
                    </div>
                </div>

                <footer className="mt-12 wide:mt-auto wide:pt-12">
                    <p className="text-sm tracking-wide text-body">Peruvian · Based in Berlin</p>
                    <div className="mt-8 flex justify-end border-t border-border pt-6">
                        <button
                            type="button"
                            onClick={onScrollNext}
                            className={`cursor-pointer text-sm text-dim transition-colors hover:text-body ${FOCUS_RING}`}
                        >
                            Next · Projects ↓
                        </button>
                    </div>
                </footer>
            </div>
        </section>
    )
}
