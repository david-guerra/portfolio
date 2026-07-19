import { createContext, useContext } from 'react'

export interface ContactContextValue {
    openContact: (trigger: HTMLElement) => void
}

export const ContactContext = createContext<ContactContextValue | null>(null)

/* Null outside ContactProvider so App can render bare (tests); triggers then no-op. */
export function useContact(): ContactContextValue | null {
    return useContext(ContactContext)
}
