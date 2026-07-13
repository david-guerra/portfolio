import assert from 'node:assert/strict'
import test from 'node:test'
import { bootWorker, wasmUrl, type WorkerHarness, type WorkerMessage } from './helpers/worker-harness.ts'

let gol: WorkerHarness

function lastBoard(messages: WorkerMessage[]): number[][] {
    const update = messages.filter((m) => m.type === 'BOARD_UPDATE').at(-1)
    assert.ok(update, 'expected a BOARD_UPDATE')
    return update.payload as number[][]
}

function liveCells(board: number[][]): string[] {
    return board
        .flatMap((row, r) => row.map((v, c) => (v ? `${r},${c}` : '')))
        .filter(Boolean)
        .sort()
}

test('INIT reports an empty 18x18 grid', async () => {
    gol = await bootWorker('src/workers/gol.worker.ts')
    const messages = await gol.send({ type: 'INIT', payload: { wasmUrl: wasmUrl('game_of_life.js') } })

    assert.ok(messages.some((m) => m.type === 'READY'))
    const board = lastBoard(messages)
    assert.equal(board.length, 18)
    assert.ok(board.every((row) => row.length === 18))
    assert.equal(liveCells(board).length, 0)
})

test('SET_CELL paints a horizontal blinker', async () => {
    await gol.send({ type: 'SET_CELL', payload: { row: 8, col: 7, val: 1 } })
    await gol.send({ type: 'SET_CELL', payload: { row: 8, col: 8, val: 1 } })
    const messages = await gol.send({ type: 'SET_CELL', payload: { row: 8, col: 9, val: 1 } })

    assert.deepEqual(liveCells(lastBoard(messages)), ['8,7', '8,8', '8,9'])
})

test('STEP oscillates the blinker to vertical', async () => {
    const messages = await gol.send({ type: 'STEP', payload: null })

    assert.deepEqual(liveCells(lastBoard(messages)), ['7,8', '8,8', '9,8'])
})

test('a second STEP oscillates it back to horizontal', async () => {
    const messages = await gol.send({ type: 'STEP', payload: null })

    assert.deepEqual(liveCells(lastBoard(messages)), ['8,7', '8,8', '8,9'])
})

test('CLEAR empties the grid', async () => {
    const messages = await gol.send({ type: 'CLEAR', payload: null })

    assert.equal(liveCells(lastBoard(messages)).length, 0)
})
