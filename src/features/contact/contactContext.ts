import { createContext, useContext } from 'react'

export interface ContactContextValue {
    openContact: (trigger: HTMLElement) => void
}

export const ContactContext = createContext<ContactContextValue | null>(null)

export function useContact(): ContactContextValue {
    const value = useContext(ContactContext)
    if (!value) throw new Error('useContact must be used inside ContactProvider')
    return value
}
