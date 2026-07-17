import React, { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import PersonCard from '../components/PersonCard.jsx'
import SkillChip from '../components/SkillChip.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listCandidatePool, getProject, sendInvitation } from '../lib/projects'
import { matchTeammates } from '../lib/aiMatch'

export default function AIMatching() {
  const { id } = useParams()
  const location = useLocation()
  const { profile } = useAuth()
  const [project, setProject] = useState(location.state?.project || null)
  const [candidates, setCandidates] = useState([])
  const [invited, setInvited] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function run() {
      setLoading(true)
      setError('')
      try {
        const p = project || (await getProject(id))
        setProject(p)
        const pool = await listCandidatePool()
        const poolWithoutSelf = pool.filter((c) => c.id !== profile.id)
        const ranked = await matchTeammates({
          projectDescription: p.description,
          requiredSkills: p.required_skills,
          candidates: poolWithoutSelf
        })
        setCandidates(ranked)
      } catch (err) {
        console.error('Teammate matching failed', err)
        setError(err.message || 'Could not load matches. Check that the embed-match Edge Function is deployed.')
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function invite(person) {
    setInvited((prev) => new Set(prev).add(person.id))
    try {
      await sendInvitation({
        projectId: id,
        fromUserId: profile.id,
        toUserId: person.id,
        message: `Your ${person.skills[0] || 'skills'} would be a great fit for ${project.title}.`
      })
    } catch (err) {
      console.error('Failed to send invitation', err)
      setInvited((prev) => {
        const next = new Set(prev)
        next.delete(person.id)
        return next
      })
    }
  }

  if (!project) return null

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-signal">
          <Sparkles size={14} /> AI teammate matching
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-blueprint-900">{project.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/60">{project.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.required_skills.map((s) => (
            <SkillChip key={s}>{s}</SkillChip>
          ))}
        </div>

        <p className="mt-6 text-sm text-ink/50">
          Ranked by skill overlap, past completed projects, and current workload — so you see people
          who are actually free, not just qualified.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-ink/40">Matching teammates…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-signal">{error}</p>
        ) : candidates.length === 0 ? (
          <p className="mt-8 text-sm text-ink/40">No candidates in the pool yet — add profiles to `profiles` for matches to appear.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {candidates.map((person) => (
              <PersonCard key={person.id} person={person} onInvite={invite} invited={invited.has(person.id)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
