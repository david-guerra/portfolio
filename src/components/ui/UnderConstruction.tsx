interface UnderConstructionProps {
    /** Description text shown below the heading */
    description: string
}

export function UnderConstruction({ description }: UnderConstructionProps) {
    return (
        <div className="h-full flex items-center justify-center p-4">
            <div className="text-center space-y-3">
                <p className="text-gruv-yellow font-bold text-lg">
                    🚧 Under Construction
                </p>
                <p className="text-gruv-fg/50 text-sm leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    )
}
