import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BentoLayout } from './layouts/BentoLayout'
import { AboutView } from './features/content/AboutView'
import { ArcadeView } from './features/content/ArcadeView'
import { ProjectsView } from './features/content/ProjectsView'
import { BlogView } from './features/content/BlogView'
import { ContactView } from './features/content/ContactView'

function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
                <Route path="/" element={<BentoLayout />}>
                    <Route index element={<AboutView />} />
                    <Route path="about" element={<Navigate to="/" replace />} />
                    <Route path="arcade" element={<ArcadeView />} />
                    <Route path="projects" element={<ProjectsView />} />
                    <Route path="blog" element={<BlogView />} />
                    <Route path="contact" element={<ContactView />} />
                    <Route path="*" element={
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                            <p className="text-6xl font-bold text-gruv-red">404</p>
                            <p className="text-gruv-fg/60">Page not found</p>
                            <a href="/" className="text-gruv-yellow hover:underline text-sm">← Back to home</a>
                        </div>
                    } />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App

