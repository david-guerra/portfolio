import assert from 'node:assert/strict'
import test from 'node:test'
import {
    contactReducer,
    createContactState,
} from '../src/features/contact/contactState.ts'

test('missing configuration starts unavailable', () => {
    assert.deepEqual(createContactState(false), { status: 'unavailable' })
})

test('configured form moves through submit and success', () => {
    const idle = createContactState(true)
    const submitting = contactReducer(idle, { type: 'started' })
    const success = contactReducer(submitting, { type: 'succeeded' })

    assert.deepEqual(idle, { status: 'idle' })
    assert.deepEqual(submitting, { status: 'submitting' })
    assert.deepEqual(success, { status: 'success' })
})

test('failure preserves the normalized reason', () => {
    const state = contactReducer(
        { status: 'submitting' },
        { type: 'failed', kind: 'rate-limited' },
    )

    assert.deepEqual(state, { status: 'error', kind: 'rate-limited' })
})

test('reset returns to the correct configured state', () => {
    assert.deepEqual(
        contactReducer({ status: 'success' }, { type: 'reset', configured: true }),
        { status: 'idle' },
    )
    assert.deepEqual(
        contactReducer({ status: 'error', kind: 'network' }, { type: 'reset', configured: false }),
        { status: 'unavailable' },
    )
})
