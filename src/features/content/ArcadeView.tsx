import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Connect4View } from '../games/connect4/Connect4View'
import { SudokuView } from '../games/sudoku/SudokuView'
import { GameOfLifeView } from '../games/gol/GameOfLifeView'

const games = [
    { id: 'connect4', cmd: './CONNECT_4', desc: '// Challenge the bot' },
    { id: 'sudoku', cmd: './SUDOKU', desc: '// Try a new sudoku!' },
    { id: 'gol', cmd: './GAME_OF_LIFE', desc: '// Play around!' },
]

export function ArcadeView() {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [activeGame, setActiveGame] = useState<string | null>(null)

    // Handle keyboard navigation (only when in menu)
    useEffect(() => {
        if (activeGame) return; // Disable menu keys when game is active

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') {
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : games.length - 1))
            } else if (e.key === 'ArrowDown') {
                setSelectedIndex(prev => (prev < games.length - 1 ? prev + 1 : 0))
            } else if (e.key === 'Enter') {
                setActiveGame(games[selectedIndex].id)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedIndex, activeGame])

    return (
        <div className="flex flex-col h-full bg-[#282828] rounded-bento border-bento font-mono p-4 relative overflow-hidden text-gruv-fg">

            {/* CRT Scanline Effect Overlay (Optional) */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20"></div>

            <div className="relative z-20 flex flex-col h-full">
                {activeGame === 'connect4' ? (
                    <Connect4View onBack={() => setActiveGame(null)} />
                ) : activeGame === 'sudoku' ? (
                    <SudokuView onBack={() => setActiveGame(null)} />
                ) : activeGame === 'gol' ? (
                    <GameOfLifeView onBack={() => setActiveGame(null)} />
                ) : (
                    <>
                        {/* Header */}
                        <div className="mb-4 rounded-bento rounded-b-none border border-bento border-gruv-green py-4 text-center text-gruv-green text-sm">
                            MENU_SELECT
                        </div>

                        {/* List */}
                        <div className="flex-1 flex flex-col justify-center space-y-4">
                            {games.map((game, index) => (
                                <motion.div
                                    key={game.id}
                                    className={cn(
                                        "flex items-center space-x-4 p-2 mx-4 cursor-pointer transition-all duration-100",
                                        selectedIndex === index ? "bg-gruv-yellow text-gruv-bg font-bold" : "text-gruv-fg"
                                    )}
                                    onClick={() => {
                                        setSelectedIndex(index);
                                        setActiveGame(game.id);
                                    }}
                                    whileHover={{ x: 10 }}
                                >
                                    <span className="w-4">{selectedIndex === index && ">"}</span>
                                    <span className="min-w-[150px]">{game.cmd}</span>
                                    <span className={cn(
                                        "text-sm hidden md:inline-block",
                                        selectedIndex === index ? "text-gruv-bg/80" : "text-gruv-fg/40"
                                    )}>{game.desc}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="mt-auto rounded-bento rounded-t-none border border-bento border-gruv-green py-4 text-center text-gruv-green text-sm">
                            [↑↓] SELECT   [ENTER] PLAY
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
