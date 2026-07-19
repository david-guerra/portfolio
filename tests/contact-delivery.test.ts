import assert from 'node:assert/strict'
import test from 'node:test'
import {
    submitContact,
    type ContactSubmission,
} from '../src/features/contact/contactDelivery.ts'

const submission: ContactSubmission = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Let us build something.',
    captchaToken: 'captcha-token',
}

test('missing configuration does not issue a request', async () => {
    const unexpectedFetch: typeof fetch = async () => {
        assert.fail('fetch must not run without an access key')
    }

    const result = await submitContact(submission, '', unexpectedFetch)
    assert.deepEqual(result, { ok: false, kind: 'unavailable' })
})

test('successful submission sends the expected Web3Forms payload', async () => {
    const fakeFetch: typeof fetch = async (input, init) => {
        assert.equal(input, 'https://api.web3forms.com/submit')
        assert.equal(init?.method, 'POST')
        assert.deepEqual(init?.headers, {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        })
        assert.deepEqual(JSON.parse(String(init?.body)), {
            access_key: 'public-routing-key',
            subject: 'New portfolio message',
            from_name: 'David Guerra portfolio',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            message: 'Let us build something.',
            'h-captcha-response': 'captcha-token',
        })
        return Response.json({ success: true })
    }

    const result = await submitContact(submission, 'public-routing-key', fakeFetch)
    assert.deepEqual(result, { ok: true })
})

test('rate limiting is distinguishable from other rejection', async () => {
    const fakeFetch: typeof fetch = async () =>
        Response.json({ success: false }, { status: 429 })

    const result = await submitContact(submission, 'public-routing-key', fakeFetch)
    assert.deepEqual(result, { ok: false, kind: 'rate-limited' })
})

test('provider rejection is normalized', async () => {
    const fakeFetch: typeof fetch = async () =>
        Response.json({ success: false }, { status: 400 })

    const result = await submitContact(submission, 'public-routing-key', fakeFetch)
    assert.deepEqual(result, { ok: false, kind: 'rejected' })
})

test('network failure is normalized', async () => {
    const fakeFetch: typeof fetch = async () => {
        throw new TypeError('network unavailable')
    }

    const result = await submitContact(submission, 'public-routing-key', fakeFetch)
    assert.deepEqual(result, { ok: false, kind: 'network' })
})
