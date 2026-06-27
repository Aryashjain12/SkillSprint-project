import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile) {
        // Profile not set up yet
        navigate('/profile')
        return
      }

      setProfile(profile)
      setLoading(false)
    }
    getProfile()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Safe avatar display with multiple fallbacks
  const getAvatar = (p) => {
    if (!p) return null
    return p.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'U')}&background=6366f1&color=fff&size=128`
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-white">
            Skill<span className="text-indigo-500">Sprint</span>
          </h1>
          <div className="flex items-center gap-3">
            <img
              src={getAvatar(profile)}
              alt={profile.full_name}
              className="w-9 h-9 rounded-full border-2 border-indigo-500 object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=6366f1&color=fff&size=128`
              }}
            />
            <button
              onClick={handleSignOut}
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Welcome */}
        <h2 className="text-3xl font-black text-white mb-6">
          Welcome, {profile.full_name?.split(' ')[0]} 👋
        </h2>

        {/* Profile Summary Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
  <div className="grid grid-cols-3 gap-4">

    {/* Your Skills */}
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-xs font-semibold mb-2">💻 Your Skills</p>
      <div className="flex flex-wrap gap-2">
        {(profile.skills || []).slice(0, 8).map((s) => (
          <span
            key={s}
            className="bg-indigo-900 text-indigo-200 text-xs px-3 py-1 rounded-full"
          >
            {s}
          </span>
        ))}
        {(profile.skills || []).length > 8 && (
          <span className="bg-gray-700 text-gray-300 text-xs px-3 py-1 rounded-full">
            +{profile.skills.length - 8} more
          </span>
        )}
      </div>
    </div>

    {/* Repositories */}
    <div className="bg-gray-800 rounded-xl p-4 text-center flex flex-col justify-center">
      <p className="text-gray-400 text-xs mb-2">Repositories</p>
      <p className="text-3xl font-black text-white">
        {profile.total_repos || 0}
      </p>
    </div>

    {/* Contribution Score */}
    <div className="bg-gray-800 rounded-xl p-4 text-center flex flex-col justify-center">
      <p className="text-gray-400 text-xs mb-2">Contribution Score</p>
      <p className="text-3xl font-black text-indigo-400">
        {profile.contribution_score || 0}
      </p>
    </div>

  </div>
</div>

        {/* Post Project Button */}
        <button
          onClick={() => navigate('/post-project')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl text-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-indigo-900/30"
        >
          Post a Project
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          Describe your idea and let AI find the best teammates for you
        </p>

      </div>
    </div>
  )
}
