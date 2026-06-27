import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function PostProject() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [description, setDescription] = useState('')
  const [techStack, setTechStack] = useState([])
  const [techInput, setTechInput] = useState('')
  const [teammatesNeeded, setTeammatesNeeded] = useState('1')
  const [duration, setDuration] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const durations = ['24 Hours', '48 Hours', '1 Week', '2 Weeks', '1 Month', 'Custom']

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) { navigate('/profile'); return }
      setProfile(profile)
    }
    getUser()
  }, [])

  const handleTechKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tech = techInput.trim().replace(',', '')
      if (tech && !techStack.includes(tech)) {
        setTechStack([...techStack, tech])
      }
      setTechInput('')
    }
  }

  const removeTech = (t) => setTechStack(techStack.filter(x => x !== t))

  const handleSubmit = async () => {
    if (!projectName || !description || techStack.length === 0) {
      alert('Please fill all details')
      return
    }
    setLoading(true)

    const avatarUrl = profile.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=6366f1&color=fff`

    const { data, error } = await supabase.from('projects').insert({
      owner_id: user.id,
      owner_name: profile.full_name,
      owner_avatar: avatarUrl,
      project_name: projectName,
      description: description,
      tech_stack: techStack,
      teammates_needed: teammatesNeeded,
      duration: duration,
      deadline: deadline || null,
      status: 'open'
    }).select().single()

    if (!error && data) {
      navigate(`/matching/${data.id}`)
    } else {
      alert('Error posting project: ' + error?.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-xl mx-auto">

        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 text-sm mb-6 hover:text-white flex items-center gap-2 transition-colors"
        >
          ← Back to Dashboard
        </button>

        <h1 className="text-3xl font-black text-white mb-1">
          Create a <span className="text-indigo-500">New Project</span>
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Describe your project and let AI recommend the best teammates.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">

          {/* Project Name */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              placeholder="e.g. AI Resume Analyzer"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">What are you building?</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. An AI-powered tool that analyzes resumes and gives smart feedback..."
              rows={3}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
            />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Tech Stack</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {techStack.map(t => (
                <span key={t} className="flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                  {t}
                  <button onClick={() => removeTech(t)} className="ml-1 text-indigo-200 hover:text-white font-bold">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={techInput}
              onChange={e => setTechInput(e.target.value)}
              onKeyDown={handleTechKeyDown}
              placeholder="Type tech and press Enter (e.g. React, Node.js)"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Teammates Needed */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">
              How many teammates do you need?
            </label>
            <div className="flex gap-3">
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  onClick={() => setTeammatesNeeded(n)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                    teammatesNeeded === n
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Project Duration */}
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Project Duration</label>
            <select
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {durations.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Deadline (optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Finding matches...' : 'Find Teammates with AI →'}
          </button>

        </div>
      </div>
    </div>
  )
}
