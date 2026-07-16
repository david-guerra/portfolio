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

test('INIT reports an empty 25x30 bitboard-backed grid', async () => {
    gol = await bootWorker('src/workers/gol.worker.ts')
    const messages = await gol.send({ type: 'INIT', payload: { wasmUrl: wasmUrl('game_of_life.js') } })

    assert.ok(messages.some((m) => m.type === 'READY'))
    const board = lastBoard(messages)
    assert.equal(board.length, 25)
    assert.ok(board.every((row) => row.length === 30))
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

test('STEP preserves toroidal wrapping at the 25x30 edges', async () => {
    await gol.send({ type: 'SET_CELL', payload: { row: 0, col: 29, val: 1 } })
    await gol.send({ type: 'SET_CELL', payload: { row: 0, col: 0, val: 1 } })
    await gol.send({ type: 'SET_CELL', payload: { row: 0, col: 1, val: 1 } })

    const messages = await gol.send({ type: 'STEP', payload: null })

    assert.deepEqual(liveCells(lastBoard(messages)), ['0,0', '1,0', '24,0'])
})

test('RANDOMIZE seeds cells with one batched board update', async () => {
    const randomGol = await bootWorker('src/workers/gol.worker.ts')
    await randomGol.send({
        type: 'INIT',
        payload: { wasmUrl: wasmUrl('game_of_life.js') },
    })
    const messages = await randomGol.send({
        type: 'RANDOMIZE',
        payload: { seed: 20260716, density: 0.22 },
    })

    assert.equal(messages.filter((message) => message.type === 'BOARD_UPDATE').length, 1)
    const first = lastBoard(messages)
    assert.ok(liveCells(first).length > 0)
    assert.ok(liveCells(first).length < first.length * first[0].length)

    const repeat = await randomGol.send({
        type: 'RANDOMIZE',
        payload: { seed: 20260716, density: 0.22 },
    })
    assert.deepEqual(lastBoard(repeat), first)
})
