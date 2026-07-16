import assert from 'node:assert/strict'
import test from 'node:test'
import { bootWorker, wasmUrl, type WorkerHarness, type WorkerMessage } from './helpers/worker-harness.ts'

type BoardUpdate = {
    board: number[][]
    initialCells: boolean[][]
    solved: boolean
    reason: 'INIT' | 'SET_CELL' | 'CLEAR_USER' | 'SOLVE' | 'RESET'
}

let sudoku: WorkerHarness
let initial: number[][]

function lastUpdate(messages: WorkerMessage[]): BoardUpdate {
    const update = messages.filter((m) => m.type === 'BOARD_UPDATE').at(-1)
    assert.ok(update, 'expected a BOARD_UPDATE')
    return update.payload as BoardUpdate
}

function filledCount(board: number[][]): number {
    return board.flat().filter((v) => v !== 0).length
}

function firstEmptyCell(board: number[][]): { r: number; c: number } {
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (board[r][c] === 0) return { r, c }
        }
    }
    assert.fail('no empty cell on the board')
}

test('INIT generates a 9x9 puzzle with at least 41 givens', async () => {
    sudoku = await bootWorker('src/workers/sudoku.worker.ts')
    const messages = await sudoku.send({ type: 'INIT', payload: { wasmUrl: wasmUrl('sudoku.js') } })

    assert.ok(messages.some((m) => m.type === 'READY'))
    const { board, initialCells, reason, solved } = lastUpdate(messages)
    assert.equal(board.length, 9)
    assert.ok(board.every((row) => row.length === 9))
    // removeDigits(b, 40) removes at most 40 cells, so 41+ givens remain
    assert.ok(filledCount(board) >= 41, `only ${filledCount(board)} givens`)
    assert.ok(filledCount(board) < 81, 'puzzle has no empty cells')
    assert.deepEqual(initialCells, board.map((row) => row.map((value) => value !== 0)))
    assert.equal(reason, 'INIT')
    assert.equal(solved, false)
    initial = board
})

test('SET_CELL refuses to overwrite a given', async () => {
    const givenIndex = initial.flat().findIndex((value) => value !== 0)
    assert.notEqual(givenIndex, -1, 'expected at least one given')
    const row = Math.floor(givenIndex / 9)
    const col = givenIndex % 9
    const given = initial[row][col]
    const replacement = given === 9 ? 1 : given + 1

    const messages = await sudoku.send({
        type: 'SET_CELL',
        payload: { row, col, val: replacement },
    })

    assert.equal(lastUpdate(messages).board[row][col], given)
})

test('SET_CELL writes a digit into an empty cell', async () => {
    const { r, c } = firstEmptyCell(initial)
    const messages = await sudoku.send({ type: 'SET_CELL', payload: { row: r, col: c, val: 5 } })

    assert.equal(lastUpdate(messages).board[r][c], 5)
})

test('CLEAR_USER erases user entries but keeps the givens', async () => {
    const messages = await sudoku.send({ type: 'CLEAR_USER' })

    assert.deepEqual(lastUpdate(messages).board, initial)
})

test('SOLVE completes the puzzle without touching the givens', async () => {
    const messages = await sudoku.send({ type: 'SOLVE' })

    const { board, solved } = lastUpdate(messages)
    assert.equal(solved, true)
    assert.equal(filledCount(board), 81)
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (initial[r][c] !== 0) {
                assert.equal(board[r][c], initial[r][c], `given at ${r},${c} changed`)
            }
        }
        // every row must be a permutation of 1..9
        assert.deepEqual([...board[r]].sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
    for (let c = 0; c < 9; c++) {
        assert.deepEqual(board.map((row) => row[c]).sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
})

test('RESET deals a fresh unsolved puzzle', async () => {
    const messages = await sudoku.send({ type: 'RESET' })

    const { board, initialCells, reason, solved } = lastUpdate(messages)
    assert.equal(solved, false)
    assert.ok(filledCount(board) >= 41)
    assert.ok(filledCount(board) < 81)
    assert.deepEqual(initialCells, board.map((row) => row.map((value) => value !== 0)))
    assert.equal(reason, 'RESET')
})

test('two fresh workers initialized immediately deal different puzzle boards', async () => {
    const firstWorker = await bootWorker('src/workers/sudoku.worker.ts')
    const init = { type: 'INIT', payload: { wasmUrl: wasmUrl('sudoku.js') } }
    const first = lastUpdate(await firstWorker.send(init)).board
    const secondWorker = await bootWorker('src/workers/sudoku.worker.ts')
    const second = lastUpdate(await secondWorker.send(init)).board

    assert.notDeepEqual(second, first)
})
