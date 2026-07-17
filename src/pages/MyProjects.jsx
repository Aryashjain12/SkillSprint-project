import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Users } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listMyProjects } from '../lib/projects'

function ProgressBar({ value }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gridline">
      <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}

export default function MyProjects() {
  const { profile } = useAuth()
  const [active, setActive] = useState([])
  const [completed, setCompleted] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      listMyProjects(profile.id)
        .then(({ active, completed }) => {
          setActive(active)
          setCompleted(completed)
        })
        .catch((err) => {
          console.error('Failed to load My Projects', err)
          setError(err.message || 'Could not load your projects.')
        })
    }
  }, [profile])

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">My projects</h1>
        {error && <p className="mt-2 text-sm text-signal">{error}</p>}

        <section className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-blueprint-900">Active projects</h2>
          <div className="flex flex-col gap-3">
            {active.map((p) => (
              <Link to={`/project-room/${p.id}`} key={p.id} className="card flex items-center justify-between gap-4 transition hover:border-blueprint-500">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-blueprint-900">{p.title}</p>
                    <span className="chip !bg-amber-light !text-amber !border-amber/30">{p.status}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-ink/50">
                    <span className="flex items-center gap-1"><Users size={13} /> {p.members?.length || 0} members</span>
                    <span>Timeline: {p.timeline}</span>
                  </div>
                  <div className="mt-2 max-w-xs"><ProgressBar value={p.progress} /></div>
                </div>
                <div className="flex -space-x-2">
                  {(p.members || []).slice(0, 4).map((m) => (
                    <img key={m.id} src={m.avatar_url} alt="" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
                  ))}
                </div>
              </Link>
            ))}
            {active.length === 0 && <p className="text-sm text-ink/40">No active projects yet.</p>}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-blueprint-900">
            <CheckCircle2 size={18} className="text-moss" /> Completed projects
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {completed.map((p) => (
              <div key={p.id} className="card">
                <p className="font-display font-semibold text-blueprint-900">{p.title}</p>
                <p className="mt-1 text-xs text-ink/50">Wrapped up · {p.timeline} timeline</p>
              </div>
            ))}
            {completed.length === 0 && <p className="text-sm text-ink/40">Nothing completed yet — keep shipping.</p>}
          </div>
        </section>
      </main>
    </div>
  )
}
