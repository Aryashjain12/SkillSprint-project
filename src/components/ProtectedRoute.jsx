import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, profile, profileError, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-blueprint-700">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/" replace />

  if (profileError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <p className="max-w-sm text-sm text-signal">{profileError}</p>
        <button onClick={signOut} className="btn-primary">Sign out and try again</button>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-blueprint-700">
        Setting up your profile…
      </div>
    )
  }

  return children
}
