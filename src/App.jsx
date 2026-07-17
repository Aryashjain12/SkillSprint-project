import React from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Profile from './pages/Profile.jsx'
import Dashboard from './pages/Dashboard.jsx'
import PostProject from './pages/PostProject.jsx'
import AIMatching from './pages/AIMatching.jsx'
import DiscoverProjects from './pages/DiscoverProjects.jsx'
import ProjectDetails from './pages/ProjectDetails.jsx'
import MyProjects from './pages/MyProjects.jsx'
import ProjectRoom from './pages/ProjectRoom.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/post-project" element={<ProtectedRoute><PostProject /></ProtectedRoute>} />
      <Route path="/ai-matching/:id" element={<ProtectedRoute><AIMatching /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><DiscoverProjects /></ProtectedRoute>} />
      <Route path="/discover/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
      <Route path="/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
      <Route path="/project-room/:id" element={<ProtectedRoute><ProjectRoom /></ProtectedRoute>} />
    </Routes>
  )
}
