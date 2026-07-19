import type { ContactDeliveryResult } from './contactDelivery.ts'

type FailureKind = Exclude<ContactDeliveryResult, { ok: true }>['kind']

export type ContactState =
    | { status: 'idle' }
    | { status: 'submitting' }
    | { status: 'success' }
    | { status: 'error'; kind: FailureKind }
    | { status: 'unavailable' }

export type ContactAction =
    | { type: 'started' }
    | { type: 'succeeded' }
    | { type: 'failed'; kind: FailureKind }
    | { type: 'reset'; configured: boolean }

export function createContactState(configured: boolean): ContactState {
    return configured ? { status: 'idle' } : { status: 'unavailable' }
}

export function contactReducer(
    _state: ContactState,
    action: ContactAction,
): ContactState {
    switch (action.type) {
        case 'started':
            return { status: 'submitting' }
        case 'succeeded':
            return { status: 'success' }
        case 'failed':
            return { status: 'error', kind: action.kind }
        case 'reset':
            return createContactState(action.configured)
    }
}
