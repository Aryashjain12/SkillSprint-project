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

  // Loads/creates the `profiles` row for the current session.
  //
  // IMPORTANT: `session.provider_token` (the GitHub token) is only present
  // right after the OAuth redirect — Supabase does NOT resend it on a
  // restored session (page refresh, new tab, coming back later). Earlier
  // this effect bailed out whenever provider_token was missing, which left
  // `profile` stuck at null forever on any returning session — a blank
  // screen with no error. Now: only use provider_token to pull fresh
  // GitHub data on an actual new login; otherwise just load the existing
  // `profiles` row by user id, which works on every return visit.
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
            bio: gh.bio,
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
          // Session exists but there's no profile row and no GitHub token
          // to create one from — surface this instead of hanging.
          setProfileError("Couldn't load your profile. Try signing out and back in.")
        }
      } catch (err) {
        console.error('Profile sync failed', err)
        setProfileError(err.message || "Couldn't load your profile. Try signing out and back in.")
      }
    }
    syncProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
