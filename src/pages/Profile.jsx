import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const [user, setUser] = useState(null)
  const [githubData, setGithubData] = useState(null)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [goals, setGoals] = useState('')
  const [hours, setHours] = useState('')
  const [mode, setMode] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }
      setUser(user)

      // Fetch repos from GitHub
      const username = user.user_metadata.user_name
      const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`)
      const repos = await res.json()

      // Extract top languages
      const languages = {}
      repos.forEach(repo => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1
        }
      })
      const topLanguages = Object.entries(languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([lang]) => lang)

      setGithubData({
        name: user.user_metadata.full_name,
        username: username,
        avatar: user.user_metadata.avatar_url,
        repos: repos.length,
      })

      // Pre-fill skills with GitHub languages
      setSkills(topLanguages)
      setLoading(false)
    }
    getUser()
  }, [])

  // Add skill on Enter or comma
  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const newSkill = skillInput.trim().replace(',', '')
      if (newSkill && !skills.includes(newSkill)) {
        setSkills([...skills, newSkill])
      }
      setSkillInput('')
    }
  }

  // Remove a skill tag
  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove))
  }

  const handleSave = async () => {
    if (!goals || !hours || !mode || skills.length === 0) {
      alert('Please fill all fields and add at least one skill!')
      return
    }

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      username: githubData.username,
      full_name: githubData.name,
      avatar_url: githubData.avatar,
      languages: skills,
      repos_count: githubData.repos,
      goals: goals,
      hours_per_week: parseInt(hours),
      mode: mode,
      contribution_score: 0
    })

    if (!error) navigate('/dashboard')
    else alert('Error saving: ' + error.message)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white text-lg">Fetching your GitHub data... ⏳</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-black text-white mb-2">
          Your <span className="text-indigo-500">Profile</span>
        </h1>
        <p className="text-gray-400 mb-8">
          GitHub data auto-fetched. Edit your skills below 👇
        </p>

        {/* GitHub Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <img src={githubData.avatar} className="w-16 h-16 rounded-full" />
            <div>
              <p className="text-white font-bold text-lg">{githubData.name}</p>
              <p className="text-gray-400 text-sm">@{githubData.username}</p>
              <p className="text-gray-400 text-sm">{githubData.repos} repositories</p>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold text-lg mb-1">Your Skills</h2>
          <p className="text-gray-500 text-xs mb-4">
            Auto-filled from GitHub. Remove what doesn't apply, add more below.
          </p>

          {/* Skill Tags */}
          <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
            {skills.length > 0 ? (
              skills.map(skill => (
                <span
                  key={skill}
                  className="flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-indigo-200 hover:text-white font-bold"
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <p className="text-gray-600 text-sm">No skills added yet</p>
            )}
          </div>

          {/* Add Skill Input */}
          <input
            type="text"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Type a skill and press Enter (e.g. Figma, DSA, React)"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
          />
          <p className="text-gray-600 text-xs mt-2">
            Press Enter or comma to add a skill
          </p>
        </div>

        {/* Goals Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-bold text-lg">Your Goals</h2>

          {/* What to learn */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">
              What do you want to learn? (e.g. React, ML, Flutter)
            </label>
            <input
              type="text"
              value={goals}
              onChange={e => setGoals(e.target.value)}
              placeholder="React, Node.js, Machine Learning..."
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Hours per week */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">
              How many hours per week are you available?
            </label>
            <input
              type="number"
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="e.g. 10"
              className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Mode */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">
              What are you looking for?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Collaborate', 'Gigs', 'Both'].map(option => (
                <button
                  key={option}
                  onClick={() => setMode(option)}
                  className={`py-3 rounded-xl text-sm font-semibold border transition-all ${
                    mode === option
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all"
          >
            Save & Continue →
          </button>
        </div>

      </div>
    </div>
  )
}