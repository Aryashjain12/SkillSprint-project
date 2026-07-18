import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GitFork, TrendingUp } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import SkillChip from '../components/SkillChip.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient'

export default function Profile() {
  const { profile, setProfile } = useAuth()
  const navigate = useNavigate()
  const [skills, setSkills] = useState(profile?.skills || [])
  const [bio, setBio] = useState(profile?.bio || '')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  function addSkill(e) {
    e.preventDefault()
    const s = draft.trim()
    if (s && !skills.includes(s)) setSkills([...skills, s])
    setDraft('')
  }

  async function save() {
    setSaving(true)
    await supabase.from('profiles').update({ skills, bio }).eq('id', profile.id)
    setProfile({ ...profile, skills, bio })
    setSaving(false)
    navigate('/dashboard')
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <p className="mt-1 text-sm text-ink/60">Pulled straight from GitHub — add your skills to get matched.</p>

        <div className="card mt-6 flex items-center gap-4">
          <img src={profile.avatar_url} alt={profile.full_name} className="h-16 w-16 rounded-full border border-gridline object-cover" />
          <div>
            <p className="font-display text-lg font-semibold text-blueprint-900">{profile.full_name}</p>
            <p className="text-sm text-ink/50">@{profile.github_username}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
              <GitFork size={13} /> {profile.repo_count} repositories · fetched from GitHub
            </p>
          </div>
        </div>

        <div className="card mt-4 flex items-center justify-between">
          <div>
            <p className="label !mb-0.5">Contribution score</p>
            <p className="text-xs text-ink/50">
             Complete tasks. Earn trust. Grow your reputation.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-moss/30 bg-moss-light px-3 py-1.5 text-moss">
            <TrendingUp size={16} />
            <span className="font-display text-lg font-semibold">{profile.contribution_score ?? 50}</span>
          </div>
        </div>

        <div className="card mt-4">
          <label className="label">Bio</label>
          <p className="mb-2 text-xs text-ink/50">
          Share what you build, what you're learning, and what kind of projects excite you.
          </p>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g.Frontend developer passionate about React and AI. Looking to collaborate on impactful open-source and startup projects."
            className="input"
          />
        </div>

        <div className="card mt-4">
          <label className="label">Add your skills</label>
          <form onSubmit={addSkill} className="flex gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. TypeScript" className="input" />
            <button type="submit" className="btn-secondary !px-4 text-sm">Add</button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => (
              <SkillChip key={s} onRemove={() => setSkills(skills.filter((x) => x !== s))}>
                {s}
              </SkillChip>
            ))}
            {skills.length === 0 && <p className="text-xs text-ink/40">No skills added yet.</p>}
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary mt-6 w-full">
          {saving ? 'Saving…' : 'Save & continue'}
        </button>
      </main>
    </div>
  )
}
