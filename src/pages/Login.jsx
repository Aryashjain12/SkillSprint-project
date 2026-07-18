import React from 'react'
import { Navigate } from 'react-router-dom'
import { Github } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { isAuthenticated, signInWithGithub } = useAuth()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="flex max-w-xl flex-col items-center text-center gap-8">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-3 gap-[3px]">
            {[1, 2, 0, 2, 3, 1, 0, 1, 2].map((i, idx) => (
              <span
                key={idx}
                className={`h-[7px] w-[7px] rounded-[2px] ${
                  ['bg-blueprint-100', 'bg-blueprint-300', 'bg-signal', 'bg-moss'][i]
                }`}
              />
            ))}
          </div>
          <span className="font-display text-lg font-semibold text-blueprint-900">
            SkillSprint
          </span>
        </div>

        <div>
          <h1 className="font-display text-4xl font-semibold leading-tight text-blueprint-900 sm:text-5xl">
            Build your dream tech team with AI.
          </h1>

          <p className="mt-4 text-ink/60">
            Connect your GitHub. Discover compatible teammates.
            Build Projects that matter.
          </p>
        </div>

        <button onClick={signInWithGithub} className="btn-primary">
          <Github size={18} />
          Continue with GitHub
        </button>
      </div>
    </div>
  )
}