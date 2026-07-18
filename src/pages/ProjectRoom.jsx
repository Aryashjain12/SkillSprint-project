import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Github, TrendingUp, Users } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Kanban from '../components/Kanban.jsx'
import Chat from '../components/Chat.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getProject,
  getProjectTasks,
  getProjectMessages,
  addTask as addTaskApi,
  moveTaskColumn,
  markTaskReviewed,
  bumpContributionScore,
  completeProject
} from '../lib/projects'

const OWNER_REVIEW_BONUS = 3

export default function ProjectRoom() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile, setProfile } = useAuth()
  const [project, setProject] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState({ todo: [], inProgress: [], done: [] })
  const [messages, setMessages] = useState([])
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    getProject(id).then((p) => {
      setProject(p)
      setMembers((p.members || []).map((m) => ({ ...m })))
    }).catch(console.error)
    getProjectTasks(id).then(setTasks).catch(console.error)
    getProjectMessages(id).then(setMessages).catch(console.error)
  }, [id])

  async function handleAddTask({ title, assigneeId, assigneeName }) {
    const task = await addTaskApi({ projectId: id, title, assigneeId, assigneeName })
    setTasks((t) => ({ ...t, todo: [...t.todo, task] }))
  }

  async function moveTask(taskId, fromColumn, toColumn) {
    setTasks((t) => {
      const task = t[fromColumn].find((x) => x.id === taskId)
      if (!task) return t
      return {
        ...t,
        [fromColumn]: t[fromColumn].filter((x) => x.id !== taskId),
        [toColumn]: [...t[toColumn], task]
      }
    })
    try {
      await moveTaskColumn(taskId, toColumn)
    } catch (err) {
      console.error('Failed to move task', err)
    }
  }

  function bumpLocalScore(userId, nextScore) {
    setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, contribution_score: nextScore } : m)))
    if (userId === profile?.id) {
      setProfile({ ...profile, contribution_score: nextScore })
    }
  }

  async function reviewTask(taskId) {
    const task = tasks.done.find((t) => t.id === taskId)
    if (!task || task.reviewed) return

    setTasks((t) => ({ ...t, done: t.done.map((x) => (x.id === taskId ? { ...x, reviewed: true } : x)) }))
    await markTaskReviewed(taskId)

    const assignee = members.find((m) => m.id === task.assigneeId)
    if (assignee) {
      const nextScore = await bumpContributionScore(assignee.id, assignee.contribution_score ?? 50)
      bumpLocalScore(assignee.id, nextScore)
    }

    const owner = members.find((m) => m.id === project.owner?.id)
    if (owner && owner.id !== assignee?.id) {
      const nextOwnerScore = await bumpContributionScore(owner.id, owner.contribution_score ?? 50, OWNER_REVIEW_BONUS)
      bumpLocalScore(owner.id, nextOwnerScore)
    }
  }

  async function requestChanges(taskId) {
    await moveTask(taskId, 'done', 'inProgress')
  }

  async function handleComplete() {
    setCompleting(true)
    try {
      await completeProject(id)
      navigate('/my-projects')
    } catch (err) {
      console.error('Failed to complete project', err)
      setCompleting(false)
    }
  }

  if (!project) return null
  const isOwner = project.owner?.id === profile?.id
  const repoUrl = project.repo_url
  const ownerGithubUrl = project.owner?.github_username ? `https://github.com/${project.owner.github_username}` : null

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-blueprint-900">{project.title}</h1>
            {repoUrl ? (
              <a
                href={repoUrl}
                target="_blank" rel="noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm text-blueprint-700 hover:underline"
              >
                <Github size={15} /> {repoUrl.replace('https://github.com/', '')}
              </a>
            ) : ownerGithubUrl ? (
              <a
                href={ownerGithubUrl}
                target="_blank" rel="noreferrer"
                className="mt-1 flex items-center gap-1.5 text-sm text-blueprint-700 hover:underline"
              >
                <Github size={15} /> No repo linked yet — {project.owner.full_name}'s GitHub
              </a>
            ) : (
              <span className="mt-1 flex items-center gap-1.5 text-sm text-ink/40">
                <Github size={15} /> No repo linked yet
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-ink/60">
              <Users size={15} /> {members.length} members
            </div>
            {isOwner && project.status !== 'completed' && (
              <button onClick={handleComplete} disabled={completing} className="btn-secondary !px-3 !py-1.5 text-xs">
                <CheckCircle2 size={14} /> {completing ? 'Marking…' : 'Mark project complete'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-lg border border-gridline bg-white px-3 py-1.5">
              <img src={m.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              <span className="text-xs font-medium text-ink/80">{m.full_name}</span>
              <span className="flex items-center gap-1 text-xs font-semibold text-moss">
                <TrendingUp size={12} /> {m.contribution_score ?? '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="mb-3 text-xs text-ink/40">
              {isOwner
                ? "You own this board — assign tasks by name, move any task forward, and review Done work. If a task is assigned to you, another member reviews it instead."
                : 'You can move your own assigned tasks forward. The owner assigns new tasks; review of Done work happens by the owner — or by you, if the task was the owner\'s own.'}
            </p>
            <Kanban
              tasks={tasks}
              isOwner={isOwner}
              currentUserId={profile?.id}
              ownerId={project.owner?.id}
              members={members}
              onAddTask={handleAddTask}
              onMoveTask={moveTask}
              onReviewTask={reviewTask}
              onRequestChanges={requestChanges}
            />
          </div>
          <div className="h-[520px]">
            <Chat projectId={id} initialMessages={messages} />
          </div>
        </div>
      </main>
    </div>
  )
}
