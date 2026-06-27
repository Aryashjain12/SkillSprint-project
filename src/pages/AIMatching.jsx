import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'

const SAMPLE_MATCHES = [
  {
    username: 'aman_verma',
    full_name: 'Aman Verma',
    avatar_url: 'https://ui-avatars.com/api/?name=Aman+Verma&background=6366f1&color=fff&size=128',
    skills: ['React', 'Node.js'],
    contribution_score: 210,
    match_percentage: 92,
    reason: 'Strong React and Node.js skills perfectly complement your project tech stack.'
  },
  {
    username: 'riya_sharma',
    full_name: 'Riya Sharma',
    avatar_url: 'https://ui-avatars.com/api/?name=Riya+Sharma&background=8b5cf6&color=fff&size=128',
    skills: ['Python', 'Machine Learning'],
    contribution_score: 198,
    match_percentage: 89,
    reason: 'AI/ML expertise will accelerate your recommendation module development.'
  },
  {
    username: 'arjun_singh',
    full_name: 'Arjun Singh',
    avatar_url: 'https://ui-avatars.com/api/?name=Arjun+Singh&background=0ea5e9&color=fff&size=128',
    skills: ['Flutter', 'Firebase'],
    contribution_score: 175,
    match_percentage: 86,
    reason: 'Cross-platform mobile experience and Firebase backend will add great value.'
  },
  {
    username: 'priya_mehta',
    full_name: 'Priya Mehta',
    avatar_url: 'https://ui-avatars.com/api/?name=Priya+Mehta&background=ec4899&color=fff&size=128',
    skills: ['UI/UX', 'Figma'],
    contribution_score: 165,
    match_percentage: 84,
    reason: 'Design skills will ensure a polished user experience across all features.'
  },
  {
    username: 'rahul_kapoor',
    full_name: 'Rahul Kapoor',
    avatar_url: 'https://ui-avatars.com/api/?name=Rahul+Kapoor&background=f59e0b&color=fff&size=128',
    skills: ['Java', 'Spring Boot'],
    contribution_score: 160,
    match_percentage: 81,
    reason: 'Backend expertise in Java will help build a robust and scalable API layer.'
  }
]

export default function AIMatching() {
  const [project, setProject] = useState(null)
  const [invitedUsernames, setInvitedUsernames] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { projectId } = useParams()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/'); return }

      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      setProject(project)

      // Simulate AI thinking for 1.5 seconds
      setTimeout(() => setLoading(false), 1500)
    }
    init()
  }, [])

  const handleInvite = async (match) => {
    await supabase.from('invitations').insert({
      project_id: projectId,
      invitee_username: match.username,
      invitee_name: match.full_name,
      invitee_avatar: match.avatar_url,
      invitee_skills: match.skills,
      match_percentage: match.match_percentage,
      match_reason: match.reason,
      status: 'invited'
    })
    setInvitedUsernames(prev => new Set([...prev, match.username]))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-white text-lg font-semibold">AI is finding your best matches... 🤖</p>
      <p className="text-gray-500 text-sm">Analyzing skills and compatibility</p>
    </div>
  )

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
          AI <span className="text-indigo-500">Teammate Recommendations</span>
        </h1>
        <p className="text-gray-400 text-sm mb-1">
          For: <span className="text-white font-semibold">{project?.project_name}</span>
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Based on your project requirements, here are the best matches.
        </p>

        {invitedUsernames.size > 0 && (
          <div className="bg-indigo-950 border border-indigo-800 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
            <p className="text-indigo-300 text-sm">
              ✅ {invitedUsernames.size} invite{invitedUsernames.size > 1 ? 's' : ''} sent
            </p>
            <button
              onClick={() => navigate(`/project-room/${projectId}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-all"
            >
              Continue to Project Room →
            </button>
          </div>
        )}

        <div className="space-y-4">
          {SAMPLE_MATCHES.map((match, index) => (
            <div key={match.username} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">

              {index === 0 && (
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full mb-3 inline-block">
                  Best Match
                </span>
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={match.avatar_url}
                    alt={match.full_name}
                    className="w-12 h-12 rounded-full border-2 border-gray-700"
                  />
                  <div>
                    <p className="text-white font-bold">{match.full_name}</p>
                    <p className="text-gray-400 text-xs">@{match.username}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-indigo-400">{match.match_percentage}%</p>
                  <p className="text-gray-500 text-xs">match</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-2">
                {match.skills.map(skill => (
                  <span key={skill} className="bg-gray-800 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>

              <p className="text-gray-400 text-xs mb-2">
                ⭐ Contribution Score: <span className="text-white font-semibold">{match.contribution_score}</span>
              </p>

              <p className="text-indigo-300 text-xs bg-indigo-950 rounded-lg px-3 py-2 mb-4">
                🤖 {match.reason}
              </p>

              {invitedUsernames.has(match.username) ? (
                <div className="w-full bg-green-900/40 border border-green-700 text-green-400 font-bold py-2.5 rounded-xl text-sm text-center">
                  ✓ Invited
                </div>
              ) : (
                <button
                  onClick={() => handleInvite(match)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
                >
                  Send Invite
                </button>
              )}

            </div>
          ))}
        </div>

        <button
          onClick={() => navigate(`/project-room/${projectId}`)}
          className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl text-sm transition-all"
        >
          Continue to Project Room →
        </button>

      </div>
    </div>
  )
}
