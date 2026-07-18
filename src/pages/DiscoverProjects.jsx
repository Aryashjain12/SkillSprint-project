import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { listDiscoverProjects, sendJoinRequest, describeJoinError, getJoinStatuses } from '../lib/projects'
import { matchProjectsForUser } from '../lib/aiMatch'

export default function DiscoverProjects() {
  const { profile } = useAuth()
  const [allProjects, setAllProjects] = useState([])
  const [recommended, setRecommended] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(true)
  const [recError, setRecError] = useState('')
  const [query, setQuery] = useState('')
  const [joinError, setJoinError] = useState('')
  const [memberProjectIds, setMemberProjectIds] = useState(new Set())
  const [requestedProjectIds, setRequestedProjectIds] = useState(new Set())
  const [statusesLoaded, setStatusesLoaded] = useState(false)
  const recRunId = useRef(0)

  useEffect(() => {
    listDiscoverProjects().then(setAllProjects).catch(console.error)
  }, [])

  useEffect(() => {
    if (!profile) return
    getJoinStatuses(profile.id)
      .then(({ memberProjectIds, requestedProjectIds }) => {
        setMemberProjectIds(memberProjectIds)
        setRequestedProjectIds(requestedProjectIds)
      })
      .catch(console.error)
      .finally(() => setStatusesLoaded(true))
  }, [profile])


  const recommendableProjects = useMemo(
    () => allProjects.filter((p) => !memberProjectIds.has(p.id) && !requestedProjectIds.has(p.id)),
    [allProjects, memberProjectIds, requestedProjectIds]
  )

  useEffect(() => {
   
    if (!statusesLoaded) return

    const runId = ++recRunId.current

    async function run() {
      if (!profile || recommendableProjects.length === 0) {
        if (runId === recRunId.current) {
          setRecommended([])
          setLoadingRecs(false)
        }
        return
      }
      setLoadingRecs(true)
      setRecError('')
      try {
        const ranked = await matchProjectsForUser({
          userSkills: profile.skills || [],
          userBio: profile.bio || '',
          projects: recommendableProjects
        })
        if (runId === recRunId.current) setRecommended(ranked.slice(0, 3))
      } catch (err) {
        console.error('Project matching failed', err)
        if (runId === recRunId.current) {
          setRecError(err.message || 'AI matching is unavailable right now — showing recent projects instead.')
          setRecommended(recommendableProjects.slice(0, 3))
        }
      } finally {
        if (runId === recRunId.current) setLoadingRecs(false)
      }
    }
    run()
  }, [profile, recommendableProjects, statusesLoaded])

  
  const filtered = useMemo(() => {
    if (!query.trim()) return allProjects
    const q = query.toLowerCase()
    return allProjects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.required_skills.some((s) => s.toLowerCase().includes(q))
    )
  }, [allProjects, query])

  async function requestJoin(project) {
    setRequestedProjectIds((prev) => new Set(prev).add(project.id))
    setJoinError('')
    try {
      await sendJoinRequest({
        projectId: project.id,
        fromUserId: profile.id,
        toUserId: project.owner.id,
        message: `${profile.full_name} wants to join ${project.title}.`
      })
    } catch (err) {
      console.error('Failed to send join request', err)
      setRequestedProjectIds((prev) => {
        const next = new Set(prev)
        next.delete(project.id)
        return next
      })
      setJoinError(describeJoinError(err))
    }
  }

  function statusFor(project) {
    if (memberProjectIds.has(project.id)) return 'member'
    if (requestedProjectIds.has(project.id)) return 'requested'
    return null
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Discover projects</h1>
        <p className="mt-1 text-sm text-ink/60">Matched to {profile?.skills?.join(', ') || 'your skills'}.</p>

        <div className="relative mt-5 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or skill…"
            className="input pl-9"
          />
        </div>
        {joinError && <p className="mt-2 text-xs text-signal">{joinError}</p>}

        <section className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-blueprint-900">
            <Sparkles size={16} className="text-signal" /> AI recommended for you
          </h2>
          {recError && <p className="mb-3 text-xs text-signal">{recError}</p>}
          {loadingRecs ? (
            <p className="text-sm text-ink/40">Matching projects to your skills…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((p) => (
                <ProjectCard key={p.id} project={p} onRequestJoin={requestJoin} joinStatus={statusFor(p)} />
              ))}
              {recommended.length === 0 && <p className="text-sm text-ink/40">No new projects to recommend right now.</p>}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-blueprint-900">Explore more</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} onRequestJoin={requestJoin} joinStatus={statusFor(p)} />
            ))}
            {filtered.length === 0 && <p className="text-sm text-ink/40">No projects match "{query}".</p>}
          </div>
        </section>
      </main>
    </div>
  )
}
