import { supabase } from '../supabaseClient'

export default function Login() {
  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/profile'
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">

        {/* Logo */}
        <div className="mb-6">
          <span className="text-4xl font-black text-white tracking-tight">
            Skill<span className="text-indigo-500">Sprint</span>
          </span>
          <p className="text-gray-400 mt-2 text-sm">
            Find teammates. Build projects. Earn from gigs.
          </p>
        </div>

        {/* Features list */}
        <div className="text-left bg-gray-800 rounded-xl p-4 mb-8 space-y-2">
          <p className="text-gray-300 text-sm">✅ AI matches you with the right teammates</p>
          <p className="text-gray-300 text-sm">✅ Earn from micro-gigs as a student</p>
          <p className="text-gray-300 text-sm">✅ Build a real contribution score for recruiters</p>
        </div>

        {/* GitHub Login Button */}
        <button
          onClick={handleGitHubLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all duration-200 text-sm"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Continue with GitHub
        </button>

        <p className="text-gray-600 text-xs mt-6">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}