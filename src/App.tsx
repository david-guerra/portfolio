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
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App

