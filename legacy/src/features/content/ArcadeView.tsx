import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '../../lib/utils'
import { Connect4View } from '../games/connect4/Connect4View'
import { SudokuView } from '../games/sudoku/SudokuView'
import { GameOfLifeView } from '../games/gol/GameOfLifeView'
import { GameMenu } from '../../components/ui/GameMenu'

const games = [
    { id: 'connect4', cmd: './CONNECT_4', desc: '// Challenge the bot' },
    { id: 'sudoku', cmd: './SUDOKU', desc: '// Try a new sudoku!' },
    { id: 'gol', cmd: './GAME_OF_LIFE', desc: '// Play around!' },
]

const connect4Difficulties = [
    { id: 'easy' as const, cmd: './EASY', desc: '// Depth 4', depth: 4 },
    { id: 'medium' as const, cmd: './MEDIUM', desc: '// Depth 6', depth: 6 },
    { id: 'hard' as const, cmd: './HARD', desc: '// Depth 12', depth: 12 },
]

// Fade-only transition variants for switching between menu and game
const fadeVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
}

type ArcadeScreen =
    | { type: 'menu' }
    | { type: 'connect4-difficulty' }
    | { type: 'connect4-game'; depth: number }
    | { type: 'sudoku' }
    | { type: 'gol' }

export function ArcadeView() {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [screen, setScreen] = useState<ArcadeScreen>({ type: 'menu' })
    const [selectedDiffIndex, setSelectedDiffIndex] = useState(2)
    const navigate = useNavigate()

    // Determine if we're on a menu screen (show GameMenu frame) or a game screen
    const isMenuScreen = screen.type === 'menu' || screen.type === 'connect4-difficulty'

    // Handle keyboard navigation for menu screens
    useEffect(() => {
        if (screen.type === 'menu') {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'ArrowUp') {
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : games.length - 1))
                } else if (e.key === 'ArrowDown') {
                    setSelectedIndex(prev => (prev < games.length - 1 ? prev + 1 : 0))
                } else if (e.key === 'Enter') {
                    const game = games[selectedIndex]
                    if (game.id === 'connect4') {
                        setScreen({ type: 'connect4-difficulty' })
                    } else if (game.id === 'sudoku') {
                        setScreen({ type: 'sudoku' })
                    } else if (game.id === 'gol') {
                        setScreen({ type: 'gol' })
                    }
                } else if (e.key === 'Escape') {
                    navigate('/')
                }
            }
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }

        if (screen.type === 'connect4-difficulty') {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === 'ArrowUp') {
                    setSelectedDiffIndex(prev => (prev > 0 ? prev - 1 : connect4Difficulties.length - 1))
                } else if (e.key === 'ArrowDown') {
                    setSelectedDiffIndex(prev => (prev < connect4Difficulties.length - 1 ? prev + 1 : 0))
                } else if (e.key === 'Enter') {
                    const diff = connect4Difficulties[selectedDiffIndex]
                    setScreen({ type: 'connect4-game', depth: diff.depth })
                } else if (e.key === 'Escape') {
                    setScreen({ type: 'menu' })
                }
            }
            window.addEventListener('keydown', handleKeyDown)
            return () => window.removeEventListener('keydown', handleKeyDown)
        }
    }, [screen, selectedIndex, selectedDiffIndex, navigate])

    const handleBack = () => {
        switch (screen.type) {
            case 'menu':
                navigate('/')
                break
            case 'connect4-difficulty':
                setScreen({ type: 'menu' })
                break
            case 'connect4-game':
                setScreen({ type: 'connect4-difficulty' })
                break
            case 'sudoku':
            case 'gol':
                setScreen({ type: 'menu' })
                break
        }
    }

    // Determine title and footer for menu screens
    const menuTitle = screen.type === 'connect4-difficulty' ? 'SELECT_DIFFICULTY' : 'MENU_SELECT'
    const menuContentKey = screen.type === 'connect4-difficulty' ? 'difficulty' : 'menu'

    // Unique key for AnimatePresence to know when to transition
    const screenKey = screen.type === 'connect4-game' ? 'connect4-game'
        : screen.type === 'sudoku' ? 'sudoku'
            : screen.type === 'gol' ? 'gol'
                : 'menu' // both 'menu' and 'connect4-difficulty' share the menu shell

    return (
        <div className="flex flex-col h-full bg-[#282828] rounded-bento border-bento font-mono p-4 relative overflow-hidden text-gruv-fg">

            {/* CRT Scanline Effect Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%] opacity-20"></div>

            <div className="relative z-20 flex flex-col h-full">
                <AnimatePresence mode="wait">
                    {isMenuScreen ? (
                        <motion.div
                            key="menu-shell"
                            className="flex flex-col h-full"
                            variants={fadeVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            <GameMenu
                                title={menuTitle}
                                contentKey={menuContentKey}
                                onBack={handleBack}
                            >
                                {screen.type === 'connect4-difficulty' ? (
                                    <>
                                        {connect4Difficulties.map((diff, index) => (
                                            <motion.div
                                                key={diff.id}
                                                className={cn(
                                                    "flex items-center space-x-4 p-2 mx-4 cursor-pointer transition-all duration-100 font-mono",
                                                    selectedDiffIndex === index ? "bg-gruv-yellow text-gruv-bg font-bold" : "text-gruv-fg"
                                                )}
                                                onClick={() => {
                                                    setSelectedDiffIndex(index);
                                                    setScreen({ type: 'connect4-game', depth: diff.depth });
                                                }}
                                                whileHover={{ x: 10 }}
                                            >
                                                <span className="w-4">{selectedDiffIndex === index && ">"}</span>
                                                <span className="min-w-[150px]">{diff.cmd}</span>
                                                <span className={cn(
                                                    "text-sm hidden md:inline-block",
                                                    selectedDiffIndex === index ? "text-gruv-bg/80" : "text-gruv-fg/40"
                                                )}>{diff.desc}</span>
                                            </motion.div>
                                        ))}
                                    </>
                                ) : (
                                    <>
                                        {games.map((game, index) => (
                                            <motion.div
                                                key={game.id}
                                                className={cn(
                                                    "flex items-center space-x-4 p-2 mx-4 cursor-pointer transition-all duration-100",
                                                    selectedIndex === index ? "bg-gruv-yellow text-gruv-bg font-bold" : "text-gruv-fg"
                                                )}
                                                onClick={() => {
                                                    setSelectedIndex(index);
                                                    if (game.id === 'connect4') {
                                                        setScreen({ type: 'connect4-difficulty' })
                                                    } else if (game.id === 'sudoku') {
                                                        setScreen({ type: 'sudoku' })
                                                    } else if (game.id === 'gol') {
                                                        setScreen({ type: 'gol' })
                                                    }
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
                                    </>
                                )}
                            </GameMenu>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={screenKey}
                            className="flex flex-col h-full"
                            variants={fadeVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            {screen.type === 'connect4-game' ? (
                                <Connect4View
                                    initialDepth={screen.depth}
                                    onBack={handleBack}
                                />
                            ) : screen.type === 'sudoku' ? (
                                <SudokuView onBack={handleBack} />
                            ) : (
                                <GameOfLifeView onBack={handleBack} />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
