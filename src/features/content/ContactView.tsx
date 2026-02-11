import { useState, type FormEvent } from 'react'
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type FormStatus = 'idle' | 'sending' | 'success' | 'error'

export function ContactView() {
    const [status, setStatus] = useState<FormStatus>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setStatus('sending')
        setErrorMsg('')

        const formData = new FormData(event.currentTarget)
        formData.append('access_key', import.meta.env.VITE_WEB3FORMS_ACCESS_KEY as string)

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                setStatus('success')
                    ; (event.target as HTMLFormElement).reset()
            } else {
                setStatus('error')
                setErrorMsg(data.message || 'Something went wrong.')
            }
        } catch {
            setStatus('error')
            setErrorMsg('Network error. Please try again.')
        }
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto space-y-6 justify-center p-4">
            <section>
                <h2 className="text-xl text-gruv-yellow font-bold mb-2">./contact</h2>
                <p className="text-gruv-fg/60 text-sm">
                    Drop me a message — I'll get back to you as soon as I can.
                </p>
            </section>

            {status === 'success' ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in">

                    <p className="text-gruv-green font-bold text-lg">Message sent!</p>
                    <p className="text-gruv-fg/60 text-sm">Thanks for reaching out.</p>
                    <button
                        onClick={() => setStatus('idle')}
                        className="mt-4 px-4 py-2 text-sm bg-gruv-bg-soft rounded-lg text-gruv-fg/70 hover:text-gruv-yellow transition-colors"
                    >
                        Send another message
                    </button>
                </div>
            ) : (
                <form onSubmit={onSubmit} className="flex flex-col space-y-4">
                    {/* Name */}
                    <div className="flex flex-col space-y-1">
                        <label htmlFor="name" className="text-xs text-gruv-fg/50 font-bold uppercase tracking-wider">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            placeholder="Your name"
                            className="bg-gruv-bg-soft border border-bento rounded-lg px-4 py-3 text-gruv-fg placeholder:text-gruv-fg/30 focus:outline-none focus:border-gruv-yellow focus:ring-1 focus:ring-gruv-yellow/30 transition-colors"
                        />
                    </div>

                    {/* Email */}
                    <div className="flex flex-col space-y-1">
                        <label htmlFor="email" className="text-xs text-gruv-fg/50 font-bold uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="your@email.com"
                            className="bg-gruv-bg-soft border border-bento rounded-lg px-4 py-3 text-gruv-fg placeholder:text-gruv-fg/30 focus:outline-none focus:border-gruv-yellow focus:ring-1 focus:ring-gruv-yellow/30 transition-colors"
                        />
                    </div>

                    {/* Message */}
                    <div className="flex flex-col space-y-1">
                        <label htmlFor="message" className="text-xs text-gruv-fg/50 font-bold uppercase tracking-wider">
                            Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            required
                            rows={5}
                            placeholder="What's on your mind?"
                            className="bg-gruv-bg-soft border border-bento rounded-lg px-4 py-3 text-gruv-fg placeholder:text-gruv-fg/30 focus:outline-none focus:border-gruv-yellow focus:ring-1 focus:ring-gruv-yellow/30 transition-colors resize-none"
                        />
                    </div>

                    {/* Error message */}
                    {status === 'error' && (
                        <div className="flex items-center space-x-2 text-gruv-red text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={status === 'sending'}
                        className="flex items-center justify-center space-x-2 bg-gruv-bg-soft border border-bento rounded-lg px-4 py-3 font-bold text-gruv-fg hover:text-gruv-yellow hover:border-gruv-yellow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {status === 'sending' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Sending...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                <span>Send Message</span>
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    )
}
