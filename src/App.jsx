import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import PostProject from './pages/PostProject'
import AIMatching from './pages/AIMatching'
import ProjectRoom from './pages/ProjectRoom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/post-project" element={<PostProject />} />
        <Route path="/matching/:projectId" element={<AIMatching />} />
        <Route path="/project-room/:projectId" element={<ProjectRoom />} />
      </Routes>
    </BrowserRouter>
  )
}