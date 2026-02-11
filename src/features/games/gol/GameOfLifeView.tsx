import { UnderConstruction } from '../../../components/ui/UnderConstruction'

import { BackButton } from '../../../components/ui/BackButton'

export function GameOfLifeView({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col h-full">
            <div className="mb-4">
                <BackButton onClick={onBack} />
            </div>
            <UnderConstruction description="Game of Life is being built. Check back soon!" />
        </div>
    )
}
