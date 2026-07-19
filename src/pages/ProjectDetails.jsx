import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Clock, Mail, Users } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import SkillChip from '../components/SkillChip.jsx'
import MatchBadge from '../components/MatchBadge.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getProject, sendJoinRequest, respondToInvitation, describeJoinError, getJoinStatuses, cancelJoinRequest } from '../lib/projects'

export default function ProjectDetails() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const invitation = location.state?.invitation || null

  const [project, setProject] = useState(null)
  const [joinStatus, setJoinStatus] = useState(null) 
  const [requestInvitationId, setRequestInvitationId] = useState(null)
  const [responded, setResponded] = useState(false)
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    getProject(id).then(setProject).catch(console.error)
  }, [id])

  
 useEffect(() => {
    if (!profile) return
    getJoinStatuses(profile.id).then(({ memberProjectIds, requestedProjectIds, requestedProjectMap }) => {
      if (memberProjectIds.has(id)) setJoinStatus('member')
      else if (requestedProjectIds.has(id)) {
        setJoinStatus('requested')
        setRequestInvitationId(requestedProjectMap.get(id))
      }
    }).catch(console.error)
  }, [profile, id])

 async function requestJoin() {
    setJoinStatus('requested')
    setJoinError('')
    try {
      const newId = await sendJoinRequest({ projectId: id, fromUserId: profile.id, toUserId: project.owner.id, message: `${profile.full_name} wants to join ${project.title}.` })
      setRequestInvitationId(newId)
    } catch (err) {
      console.error('Failed to send join request', err)
      setJoinStatus(null)
      setJoinError(describeJoinError(err))
    }
  }

  async function cancelRequest() {
    if (!requestInvitationId) return
    setJoinStatus(null)
    try {
      await cancelJoinRequest(requestInvitationId)
    } catch (err) {
      console.error('Failed to cancel request', err)
      setJoinStatus('requested')
    }
  }

  async function respond(accept) {
    setResponded(true)
    try {
      await respondToInvitation({ invitationId: invitation.id, accept })
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to respond to invitation', err)
      setResponded(false)
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-ink/40">Loading project…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        {invitation && (
          <p className="mb-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-signal">
            <Mail size={13} />
            {invitation.type === 'request' ? `${invitation.from.full_name} wants to join this project` : `You were invited by ${invitation.from.full_name}`}
          </p>
        )}

        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-2xl font-semibold text-blueprint-900">{project.title}</h1>
          {typeof project.match_percent === 'number' && <MatchBadge percent={project.match_percent} />}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <img src={project.owner.avatar_url} alt="" className="h-8 w-8 rounded-full border border-gridline object-cover" />
          <span className="text-sm text-ink/60">{project.owner.full_name}</span>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-ink/70">{project.description}</p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.required_skills.map((s) => <SkillChip key={s}>{s}</SkillChip>)}
        </div>

        <div className="mt-5 flex items-center gap-5 text-sm text-ink/50">
          <span className="flex items-center gap-1.5"><Users size={15} /> {project.team_size} people</span>
          <span className="flex items-center gap-1.5"><Clock size={15} /> {project.timeline}</span>
          <span className="chip">{project.difficulty}</span>
        </div>

        {invitation ? (
          <div className="mt-8 flex gap-3">
            <button onClick={() => respond(false)} disabled={responded} className="btn-secondary">Decline</button>
            <button onClick={() => respond(true)} disabled={responded} className="btn-primary">
              {invitation.type === 'request' ? 'Approve request' : 'Accept invitation'}
            </button>
          </div>
        ) : joinStatus === 'member' ? (
          <p className="mt-8 text-sm font-semibold text-moss">You're already part of this project.</p>
        ) : (
          <>
            {joinStatus === 'requested' ? (
              <button onClick={cancelRequest} className="btn-secondary mt-8">Cancel request</button>
            ) : (
              <button onClick={requestJoin} className="btn-primary mt-8">Request to join</button>
            )}
            {joinError && <p className="mt-2 text-xs text-signal">{joinError}</p>}
          </>
        )}
      </main>
    </div>
  )
}
