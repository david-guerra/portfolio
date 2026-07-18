const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit'

export interface ContactSubmission {
    name: string
    email: string
    message: string
    captchaToken: string
}

export type ContactDeliveryResult =
    | { ok: true }
    | {
          ok: false
          kind: 'unavailable' | 'rate-limited' | 'rejected' | 'network'
      }

export async function submitContact(
    submission: ContactSubmission,
    accessKey: string,
    fetchImpl: typeof fetch = fetch,
): Promise<ContactDeliveryResult> {
    if (!accessKey.trim()) {
        return { ok: false, kind: 'unavailable' }
    }

    try {
        const response = await fetchImpl(WEB3FORMS_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                access_key: accessKey,
                subject: 'New portfolio message',
                from_name: 'David Guerra portfolio',
                name: submission.name.trim(),
                email: submission.email.trim(),
                message: submission.message.trim(),
                'h-captcha-response': submission.captchaToken,
            }),
        })

        if (response.status === 429) {
            return { ok: false, kind: 'rate-limited' }
        }

        const payload = (await response.json()) as { success?: boolean }
        return response.ok && payload.success === true
            ? { ok: true }
            : { ok: false, kind: 'rejected' }
    } catch {
        return { ok: false, kind: 'network' }
    }
}
