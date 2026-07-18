import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, FolderKanban, Inbox, PlusCircle, TrendingUp } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import SkillChip from '../components/SkillChip.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listInvitations, respondToInvitation } from '../lib/projects'

export default function Dashboard() {
  const { profile } = useAuth()
  const [invitations, setInvitations] = useState([])

  useEffect(() => {
    if (profile) listInvitations(profile.id).then(setInvitations).catch(console.error)
  }, [profile])

  async function handleRespond(inv, accept) {
    setInvitations((prev) => prev.filter((i) => i.id !== inv.id))
    try {
      await respondToInvitation({ invitationId: inv.id, accept })
    } catch (err) {
      console.error('Failed to respond to invitation', err)
    }
  }

  if (!profile) return null

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={profile.avatar_url} alt="" className="h-14 w-14 rounded-full border border-gridline object-cover" />
            <div>
              <h1 className="font-display text-2xl font-semibold text-blueprint-900">Hello, {profile.full_name} 👋</h1>
              {profile.bio && <p className="mt-1 text-sm text-ink/60">{profile.bio}</p>}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <SkillChip key={s}>{s}</SkillChip>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-moss/30 bg-moss-light px-3 py-1.5 text-moss">
            <TrendingUp size={16} />
            <span className="font-display text-lg font-semibold">{profile.contribution_score ?? 50}</span>
            <span className="text-xs font-medium">contribution score</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link to="/post-project" className="card group flex flex-col items-start gap-2 transition hover:border-signal">
            <PlusCircle className="text-signal" size={22} />
            <p className="font-display font-semibold">Post a project</p>
            <p className="text-sm text-ink/60">Describe an idea and let AI staff it for you.</p>
          </Link>
          <Link to="/discover" className="card group flex flex-col items-start gap-2 transition hover:border-blueprint-500">
            <Compass className="text-blueprint-700" size={22} />
            <p className="font-display font-semibold">Discover projects</p>
            <p className="text-sm text-ink/60">AI-recommended builds that match your skills.</p>
          </Link>
          <Link to="/my-projects" className="card group flex flex-col items-start gap-2 transition hover:border-moss">
            <FolderKanban className="text-moss" size={22} />
            <p className="font-display font-semibold">My projects</p>
            <p className="text-sm text-ink/60">Track what's in progress and what shipped.</p>
          </Link>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-blueprint-900">
            <Inbox size={18} /> Recent invitations
          </h2>
          <div className="flex flex-col gap-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={inv.from.avatar_url} alt="" className="h-9 w-9 rounded-full border border-gridline object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-blueprint-900">{inv.project_title}</p>
                    <p className="text-xs text-ink/60">
                      {inv.type === 'request' ? `${inv.from.full_name} wants to join` : `Invited by ${inv.from.full_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/discover/${inv.project_id}`}
                    state={{ invitation: inv }}
                    className="text-xs font-semibold text-blueprint-700 hover:underline"
                  >
                    View details
                  </Link>
                  <button onClick={() => handleRespond(inv, false)} className="btn-secondary !px-3 !py-1.5 text-xs">Decline</button>
                  <button onClick={() => handleRespond(inv, true)} className="btn-primary !px-3 !py-1.5 text-xs">Accept</button>
                </div>
              </div>
            ))}
            {invitations.length === 0 && <p className="text-sm text-ink/40">No invitations yet.</p>}
          </div>
        </section>
      </main>
    </div>
  )
}
