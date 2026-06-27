import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'

// Default tasks for prototype
const DEFAULT_TASKS = [
  { id: 'default-1', title: 'Design Landing Page', status: 'todo' },
  { id: 'default-2', title: 'Setup Database', status: 'todo' },
  { id: 'default-3', title: 'GitHub Authentication', status: 'in_progress' },
  { id: 'default-4', title: 'Project Setup', status: 'done' },
]

// Default chat messages for prototype
const DEFAULT_MESSAGES = [
  {
    id: 'msg-1',
    sender_name: 'Aman',
    sender_avatar: 'https://ui-avatars.com/api/?name=Aman+Verma&background=6366f1&color=fff&size=128',
    content: "I'll complete the backend integration today.",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'msg-2',
    sender_name: 'Riya',
    sender_avatar: 'https://ui-avatars.com/api/?name=Riya+Sharma&background=8b5cf6&color=fff&size=128',
    content: "I'll work on the AI recommendation module.",
    created_at: new Date(Date.now() - 1800000).toISOString()
  }
]

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'text-gray-400', bg: 'bg-gray-800' },
  { key: 'in_progress', label: 'In Progress', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  { key: 'done', label: 'Done', color: 'text-green-400', bg: 'bg-green-900/30' }
]

export default function ProjectRoom() {
  const [project, setProject] = useState(null)
  const [profile, setProfile] = useState(null)
  const [invitations, setInvitations] = useState([])
  const [tasks, setTasks] = useState([])
  const [messages, setMessages] = useState(DEFAULT_MESSAGES)
  const [newMessage, setNewMessage] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('board')
  const chatEndRef = useRef(null)
  const navigate = useNavigate()
  const { projectId } = useParams()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      // Load profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profile)

      // Load project
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      setProject(project)

      // Load invitations (accepted teammates)
      const { data: invites } = await supabase
        .from('invitations')
        .select('*')
        .eq('project_id', projectId)
      setInvitations(invites || [])

      // Load tasks (or use defaults)
      const { data: dbTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at')

      if (dbTasks && dbTasks.length > 0) {
        setTasks(dbTasks)
      } else {
        // Insert default tasks
        const { data: inserted } = await supabase
          .from('tasks')
          .insert(DEFAULT_TASKS.map(t => ({ title: t.title, status: t.status, project_id: projectId })))
          .select()
        setTasks(inserted || DEFAULT_TASKS)
      }

      // Load messages
      const { data: dbMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at')

      if (dbMessages && dbMessages.length > 0) {
        setMessages(dbMessages)
      } else {
        setMessages(DEFAULT_MESSAGES)
      }

      setLoading(false)
    }
    init()
  }, [])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeTab])

  // Realtime for messages
  useEffect(() => {
    const channel = supabase
      .channel('room-messages-' + projectId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `project_id=eq.${projectId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [projectId])

  const sendMessage = async () => {
  if (!newMessage.trim() || !profile) return

  const avatarUrl =
    profile.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=6366f1&color=fff`

  const msgObj = {
    project_id: projectId,
    sender_name: profile.full_name?.split(' ')[0] || 'You',
    sender_avatar: avatarUrl,
    content: newMessage.trim()
  }

  const { error } = await supabase
    .from('messages')
    .insert(msgObj)

  if (error) {
    console.error(error)
    alert("Couldn't send message")
    return
  }

  // Realtime listener automatically updates the chat
  setNewMessage('')
}

  const moveTask = async (task, newStatus) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    if (typeof task.id === 'string' && task.id.startsWith('default')) return
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim()) return
    const { data } = await supabase.from('tasks').insert({
      project_id: projectId,
      title: newTaskTitle.trim(),
      status: 'todo'
    }).select().single()

    if (data) {
      setTasks(prev => [...prev, data])
    } else {
      setTasks(prev => [...prev, { id: Date.now(), title: newTaskTitle.trim(), status: 'todo' }])
    }
    setNewTaskTitle('')
    setAddingTask(false)
  }

  const getAvatar = (avatarUrl, name) => {
    return avatarUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=6366f1&color=fff&size=128`
  }

  const formatTime = (iso) => {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // Build team: owner + invited people
  const teamMembers = [
    {
      name: profile?.full_name?.split(' ')[0] + ' (You)',
      avatar: getAvatar(profile?.avatar_url, profile?.full_name),
      role: 'Project Owner'
    },
    ...invitations.map(inv => ({
      name: inv.invitee_name?.split(' ')[0] || inv.invitee_username,
      avatar: getAvatar(inv.invitee_avatar, inv.invitee_name),
      role: 'Teammate',
      status: inv.status
    }))
  ]

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-500 text-xs hover:text-gray-300 mb-1 flex items-center gap-1 transition-colors"
            >
              ← Dashboard
            </button>
            <h1 className="text-2xl font-black text-white">Project Room</h1>
            <p className="text-indigo-400 text-sm font-semibold">📁 {project?.project_name}</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded-full">🟢 Active</span>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-5">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Team Members</p>
          <div className="flex flex-wrap gap-4">
            {teamMembers.map((member, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="relative">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-12 h-12 rounded-full border-2 border-gray-700 object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&background=6366f1&color=fff&size=128`
                    }}
                  />
                  {i === 0 && (
                    <span className="absolute -top-1 -right-1 text-xs">👑</span>
                  )}
                </div>
                <p className="text-white text-xs font-semibold text-center max-w-[70px] leading-tight">{member.name}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  i === 0
                    ? 'bg-indigo-900 text-indigo-300'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 mb-5">
          <button
            onClick={() => setActiveTab('board')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'board'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Project Board
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            💬 Live Chat
          </button>
        </div>

        {/* PROJECT BOARD */}
        {activeTab === 'board' && (
          <div>
            <div className="grid grid-cols-3 gap-3">
              {COLUMNS.map(col => (
                <div key={col.key} className="bg-gray-900 border border-gray-800 rounded-2xl p-3">
                  <div className={`flex items-center justify-between mb-3`}>
                    <p className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                      {col.label}
                    </p>
                    <span className="text-xs text-gray-600">
                      {tasks.filter(t => t.status === col.key).length}
                    </span>
                  </div>

                  <div className="space-y-2 min-h-[80px]">
                    {tasks.filter(t => t.status === col.key).map(task => (
                      <div
                        key={task.id}
                        className={`${col.bg} border border-gray-700/50 rounded-xl p-3 text-xs text-gray-200`}
                      >
                        <p className="font-medium mb-2">{task.title}</p>
                        <div className="flex flex-col gap-1">
                          {col.key !== 'todo' && (
                            <button
                              onClick={() => moveTask(task, col.key === 'in_progress' ? 'todo' : 'in_progress')}
                              className="text-gray-500 hover:text-gray-300 text-left transition-colors"
                            >
                              ← {col.key === 'in_progress' ? 'Move to To Do' : 'Move to In Progress'}
                            </button>
                          )}
                          {col.key !== 'done' && (
                            <button
                              onClick={() => moveTask(task, col.key === 'todo' ? 'in_progress' : 'done')}
                              className="text-indigo-400 hover:text-indigo-300 text-left transition-colors"
                            >
                              → {col.key === 'todo' ? 'Start' : 'Mark Done ✓'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add task (only in To Do column) */}
                  {col.key === 'todo' && (
                    <div className="mt-2">
                      {addingTask ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTask()}
                            placeholder="Task title..."
                            autoFocus
                            className="w-full bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none focus:border-indigo-500"
                          />
                          <div className="flex gap-1">
                            <button onClick={addTask} className="flex-1 bg-indigo-600 text-white text-xs py-1 rounded-lg">Add</button>
                            <button onClick={() => setAddingTask(false)} className="flex-1 bg-gray-800 text-gray-400 text-xs py-1 rounded-lg">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingTask(true)}
                          className="w-full text-gray-600 hover:text-gray-400 text-xs py-1.5 border border-dashed border-gray-800 hover:border-gray-700 rounded-xl transition-all"
                        >
                          + Add task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIVE CHAT */}
        {activeTab === 'chat' && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <p className="text-white font-bold text-sm">💬 Live Team Chat</p>
            </div>

            {/* Messages */}
            <div className="h-72 overflow-y-auto px-4 py-4 space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.sender_name === profile?.full_name?.split(' ')[0] ||
                              msg.sender_name === 'You'
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                    <img
                      src={msg.sender_avatar}
                      alt={msg.sender_name}
                      className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender_name || 'U')}&background=6366f1&color=fff&size=128`
                      }}
                    />
                    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-gray-400 text-xs font-semibold">{msg.sender_name}</p>
                        <p className="text-gray-600 text-xs">{formatTime(msg.created_at)}</p>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                        isOwn
                          ? 'bg-indigo-600 text-white rounded-tr-sm'
                          : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-800 flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                Send
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}