import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ContactProvider from './features/contact/ContactProvider.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ContactProvider>
            <App />
        </ContactProvider>
    </StrictMode>,
)
