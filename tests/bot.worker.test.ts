import assert from 'node:assert/strict'
import test from 'node:test'
import { bootWorker, wasmUrl, type WorkerHarness, type WorkerMessage } from './helpers/worker-harness.ts'

type GameUpdate = { board: number[][]; status: string; winner: number }

let bot: WorkerHarness

function lastUpdate(messages: WorkerMessage[]): GameUpdate {
    const update = messages.filter((m) => m.type === 'GAME_UPDATE').at(-1)
    assert.ok(update, 'expected a GAME_UPDATE')
    return update.payload as GameUpdate
}

function pieces(board: number[][]): { r: number; c: number; v: number }[] {
    return board.flatMap((row, r) =>
        row.flatMap((v, c) => (v !== 0 ? [{ r, c, v }] : [])),
    )
}

test('INIT loads the wasm engine and reports an empty 6x7 board', async () => {
    bot = await bootWorker('src/workers/bot.worker.ts')
    const messages = await bot.send({ type: 'INIT', payload: { wasmUrl: wasmUrl('game_bot.js') } })

    assert.ok(messages.some((m) => m.type === 'READY'))
    const { board, status, winner } = lastUpdate(messages)
    assert.equal(board.length, 6)
    assert.ok(board.every((row) => row.length === 7))
    assert.equal(pieces(board).length, 0)
    assert.equal(status, 'playing')
    assert.equal(winner, 0)
})

test('USER_MOVE drops a player-1 piece in the chosen column', async () => {
    const messages = await bot.send({ type: 'USER_MOVE', payload: 3 })

    const placed = pieces(lastUpdate(messages).board)
    assert.equal(placed.length, 1)
    assert.equal(placed[0].c, 3)
    assert.equal(placed[0].v, 1)
})

test('an out-of-range USER_MOVE is rejected without a board update', async () => {
    const messages = await bot.send({ type: 'USER_MOVE', payload: 9 })
    assert.equal(messages.length, 0)
})

test('COMPUTE_MOVE answers with a legal bot move after SET_DIFFICULTY', async () => {
    await bot.send({ type: 'SET_DIFFICULTY', payload: 4 })
    const messages = await bot.send({ type: 'COMPUTE_MOVE', payload: null })

    const moveComputed = messages.find((m) => m.type === 'MOVE_COMPUTED')
    assert.ok(moveComputed, 'expected MOVE_COMPUTED')
    const col = moveComputed.payload as number
    assert.ok(col >= 0 && col <= 6, `bot column ${col} out of range`)

    const { board, status } = lastUpdate(messages)
    const placed = pieces(board)
    assert.equal(placed.length, 2)
    assert.ok(placed.some((p) => p.v === 2), 'bot piece missing')
    assert.equal(status, 'playing')
})

test('RESET returns to an empty board', async () => {
    const messages = await bot.send({ type: 'RESET', payload: null })

    const { board, status, winner } = lastUpdate(messages)
    assert.equal(pieces(board).length, 0)
    assert.equal(status, 'playing')
    assert.equal(winner, 0)
})

test('four in a column wins the game for player 1', async () => {
    let update: GameUpdate | undefined
    for (const col of [0, 1, 0, 1, 0, 1, 0]) {
        update = lastUpdate(await bot.send({ type: 'USER_MOVE', payload: col }))
    }

    assert.ok(update)
    assert.equal(update.status, 'won')
    assert.equal(update.winner, 1)
    const columnZero = pieces(update.board).filter((p) => p.c === 0 && p.v === 1)
    assert.equal(columnZero.length, 4)
})
