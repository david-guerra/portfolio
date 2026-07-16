interface PreviewProps {
    className?: string
}

const SUDOKU_VALUES = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [0, 7, 0, 0, 2, 0, 6, 0, 0],
    [0, 6, 0, 0, 0, 2, 8, 0, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 8, 0, 0, 0, 0, 0, 7, 9],
] as const

const CONNECT_FOUR_PIECES = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0],
    [0, 1, 2, 1, 2, 2, 0],
    [1, 2, 1, 2, 1, 2, 1],
    [1, 2, 1, 2, 1, 2, 1],
] as const

const LIFE_CELLS = [
    [3, 2], [4, 2], [5, 2], [8, 4], [9, 4], [10, 4], [7, 5], [10, 5],
    [6, 6], [9, 6], [12, 7], [13, 7], [14, 7], [12, 8], [14, 8], [13, 9],
    [20, 3], [21, 3], [22, 3], [23, 4], [19, 5], [23, 5], [19, 6], [20, 7],
] as const

export function SudokuPreview({ className = '' }: PreviewProps) {
    return (
        <svg
            role="img"
            aria-label="Sudoku preview"
            viewBox="0 0 180 180"
            className={className}
        >
            <rect width="180" height="180" className="fill-bg" />
            {Array.from({ length: 10 }, (_, index) => (
                <g key={index} className="stroke-teal/45">
                    <path
                        d={`M${index * 20} 0V180`}
                        strokeWidth={index % 3 === 0 ? 1.5 : 0.6}
                    />
                    <path
                        d={`M0 ${index * 20}H180`}
                        strokeWidth={index % 3 === 0 ? 1.5 : 0.6}
                    />
                </g>
            ))}
            {SUDOKU_VALUES.flatMap((row, rowIndex) =>
                row.map((value, columnIndex) =>
                    value ? (
                        <text
                            key={`${rowIndex}-${columnIndex}`}
                            x={columnIndex * 20 + 10}
                            y={rowIndex * 20 + 14}
                            textAnchor="middle"
                            className="fill-teal text-[10px]"
                        >
                            {value}
                        </text>
                    ) : null,
                ),
            )}
        </svg>
    )
}

export function ConnectFourPreview({ className = '' }: PreviewProps) {
    return (
        <svg
            role="img"
            aria-label="Connect Four preview"
            viewBox="0 0 210 180"
            className={className}
        >
            <rect width="210" height="180" className="fill-bg" />
            {CONNECT_FOUR_PIECES.flatMap((row, rowIndex) =>
                row.map((piece, columnIndex) => (
                    <circle
                        key={`${rowIndex}-${columnIndex}`}
                        cx={columnIndex * 30 + 15}
                        cy={rowIndex * 30 + 15}
                        r="11"
                        className={
                            piece === 1
                                ? 'fill-orange stroke-orange'
                                : piece === 2
                                  ? 'fill-olive stroke-olive'
                                  : 'fill-transparent stroke-dim/55'
                        }
                        strokeWidth="1"
                    />
                )),
            )}
        </svg>
    )
}

export function GameOfLifePreview({ className = '' }: PreviewProps) {
    return (
        <svg
            role="img"
            aria-label="Game of Life preview"
            viewBox="0 0 290 140"
            className={className}
        >
            <rect width="290" height="140" className="fill-bg" />
            {Array.from({ length: 14 }, (_, row) =>
                Array.from({ length: 29 }, (_, column) => (
                    <rect
                        key={`${row}-${column}`}
                        x={column * 10 + 4.25}
                        y={row * 10 + 4.25}
                        width="1.5"
                        height="1.5"
                        className="fill-border"
                    />
                )),
            )}
            {LIFE_CELLS.map(([column, row]) => (
                <rect
                    key={`${row}-${column}`}
                    x={column * 10 + 2}
                    y={row * 10 + 2}
                    width="6"
                    height="6"
                    className="fill-olive"
                />
            ))}
        </svg>
    )
}
