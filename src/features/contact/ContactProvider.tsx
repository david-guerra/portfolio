import { useRef, useState, type ReactNode } from 'react'
import { ContactContext } from './contactContext.ts'
import ContactDialog from './ContactDialog.tsx'

export default function ContactProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false)
    const triggerRef = useRef<HTMLElement | null>(null)

    const openContact = (trigger: HTMLElement) => {
        triggerRef.current = trigger
        setOpen(true)
    }

    const closeContact = () => {
        setOpen(false)
        requestAnimationFrame(() => triggerRef.current?.focus())
    }

    return (
        <ContactContext.Provider value={{ openContact }}>
            {children}
            <ContactDialog
                open={open}
                onRequestClose={closeContact}
            />
        </ContactContext.Provider>
    )
}
