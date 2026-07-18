import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { fetchGithubProfile } from '../lib/github'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function syncProfile() {
      if (!session) return
      setProfileError('')
      try {
        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (session.provider_token) {
          const gh = await fetchGithubProfile(session.provider_token)
          const merged = {
            id: session.user.id,
            github_username: gh.github_username,
            full_name: gh.full_name,
            avatar_url: gh.avatar_url,
            bio: existing?.bio ?? gh.bio,
            repo_count: gh.repo_count,
            skills: existing?.skills ?? gh.inferred_skills,
            contribution_score: existing?.contribution_score ?? 50
          }
          await supabase.from('profiles').upsert(merged)
          setProfile(merged)
          navigate(existing ? '/dashboard' : '/profile')
        } else if (existing) {
          setProfile(existing)
        } else {
          setProfileError("Couldn't load your profile. Try signing out and back in.")
        }
      } catch (err) {
        console.error('Profile sync failed', err)
        setProfileError(err.message || "Couldn't load your profile. Try signing out and back in.")
      }
    }
    syncProfile()
  }, [session])

  async function signInWithGithub() {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { scopes: 'read:user repo', redirectTo: window.location.origin }
    })
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    setProfileError('')
  }

  const value = {
    loading,
    isAuthenticated: Boolean(session),
    session,
    profile,
    profileError,
    setProfile,
    signInWithGithub,
    signOut
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
