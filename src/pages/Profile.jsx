import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

// Helper: get avatar URL safely from Supabase user object
function getAvatarUrl(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.full_name || user?.email || 'U')}&background=6366f1&color=fff`
  )
}

export default function Profile() {
  const [user, setUser] = useState(null)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [totalRepos, setTotalRepos] = useState(0)
  const [contributionScore, setContributionScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }
      setUser(user)

      const githubUsername = user.user_metadata?.user_name || user.user_metadata?.preferred_username

      // Fetch GitHub repos to extract languages
      try {
        const res = await fetch(`https://api.github.com/users/${githubUsername}/repos?per_page=100`)
        const repos = await res.json()

        if (Array.isArray(repos)) {
          setTotalRepos(repos.length)

          // Extract unique languages from repos
          const langSet = new Set()
          repos.forEach(repo => { if (repo.language) langSet.add(repo.language) })
          setSkills([...langSet])

          // Contribution score
          const score = repos.reduce((sum, r) => sum + r.stargazers_count*2 + r.forks_count*3, 0)
          setContributionScore(Math.max(score + repos.length * 10, 50))
        }
      } catch (e) {
        console.warn('GitHub API error:', e)
        setSkills(['JavaScript'])
        setTotalRepos(0)
        setContributionScore(50)
      }

      setLoading(false)
    }
    init()
  }, [])

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = skillInput.trim().replace(',', '')
      if (val && !skills.includes(val)) setSkills([...skills, val])
      setSkillInput('')
    }
  }

  const removeSkill = (s) => setSkills(skills.filter(x => x !== s))

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const avatarUrl = getAvatarUrl(user)
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email
    const username = user.user_metadata?.user_name || user.user_metadata?.preferred_username || user.email

    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName,
      username: username,
      avatar_url: avatarUrl,
      skills: skills,
      contribution_score: contributionScore,
      total_repos: totalRepos
    })

    if (error) {
      alert('Error saving profile: ' + error.message)
      setSaving(false)
      return
    }

    navigate('/dashboard')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Importing your GitHub profile...</p>
      </div>
    </div>
  )

  const avatarUrl = getAvatarUrl(user)
  const fullName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'
  const username = user?.user_metadata?.user_name || user?.user_metadata?.preferred_username || ''

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-10">
      <div className="max-w-md mx-auto">

        <h1 className="text-3xl font-black text-white mb-1">Your Profile</h1>
        <p className="text-gray-400 text-sm mb-6">
          We've imported your GitHub profile. Review your details before continuing.
        </p>

        {/* GitHub Profile Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4 flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-16 h-16 rounded-full border-2 border-indigo-500 object-cover"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6366f1&color=fff&size=128`
            }}
          />
          <div>
            <p className="text-white font-bold text-lg">{fullName}</p>
            <p className="text-gray-400 text-sm">@{username}</p>
            <p className="text-gray-500 text-xs mt-1">{totalRepos} Repositories</p>
          </div>
        </div>

        {/* Skills */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-gray-400 text-sm font-semibold mb-3">Your Skills</p>
          <p className="text-gray-500 text-xs mb-3">Automatically fetched from GitHub repositories.</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {skills.map(s => (
              <span key={s} className="flex items-center gap-1 bg-indigo-900 text-indigo-200 text-xs px-3 py-1 rounded-full">
                {s}
                <button onClick={() => removeSkill(s)} className="ml-1 text-indigo-400 hover:text-white font-bold">×</button>
              </span>
            ))}
          </div>

          <input
            type="text"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={handleSkillKeyDown}
            placeholder="Add Skill (press Enter)"
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-700 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save & Continue →'}
        </button>

      </div>
    </div>
  )
}
