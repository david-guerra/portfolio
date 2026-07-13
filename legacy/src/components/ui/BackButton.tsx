export function BackButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="text-gruv-green hover:underline font-mono z-30"
        >
            {'< BACK'}
        </button>
    )
}
