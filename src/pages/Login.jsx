import React from 'react'
import { Navigate } from 'react-router-dom'
import { Github, ListChecks, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

function ScoreMechanic() {
  const steps = [
    { icon: ListChecks, label: 'Owner assigns you a task', tint: 'text-blueprint-700' },
    { icon: ShieldCheck, label: 'You finish it, owner reviews it', tint: 'text-amber' },
    { icon: TrendingUp, label: 'Your score goes up', tint: 'text-moss' }
  ]
  return (
    <div className="flex flex-col gap-3">
      {steps.map((s, i) => {
        const Icon = s.icon
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gridline bg-white">
              <Icon size={17} className={s.tint} />
            </span>
            <p className="text-sm text-ink/70">{s.label}</p>
            {i < steps.length - 1 && <ArrowRight size={14} className="ml-auto shrink-0 text-ink/20" />}
          </div>
        )
      })}
    </div>
  )
}

export default function Login() {
  const { isAuthenticated, signInWithGithub } = useAuth()

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="flex flex-col justify-center gap-8 px-8 py-16 sm:px-16">
        <div className="flex items-center gap-2">
          <div className="grid grid-cols-3 gap-[3px]">
            {[1, 2, 0, 2, 3, 1, 0, 1, 2].map((i, idx) => (
              <span key={idx} className={`h-[7px] w-[7px] rounded-[2px] ${['bg-blueprint-100', 'bg-blueprint-300', 'bg-signal', 'bg-moss'][i]}`} />
            ))}
          </div>
          <span className="font-display text-lg font-semibold text-blueprint-900">SkillSprint</span>
        </div>

        <div>
          <h1 className="max-w-md font-display text-4xl font-semibold leading-tight text-blueprint-900 sm:text-5xl">
            Build your dream tech team with AI.
          </h1>
          <p className="mt-4 max-w-sm text-ink/60">
            Connect your GitHub, tell us your skills, and let AI match you to teammates and side
            projects worth shipping.
          </p>
        </div>

        <div>
          <button onClick={signInWithGithub} className="btn-primary">
            <Github size={18} /> Continue with GitHub
          </button>
        </div>
      </div>

      <div className="grid-texture hidden items-center justify-center border-l border-gridline p-16 md:flex">
        <div className="max-w-sm rounded-2xl border border-gridline bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink/40">
            Your contribution score is earned, not guessed
          </p>
          <ScoreMechanic />
          <p className="mt-5 text-sm text-ink/60">
            No vanity metrics. Your score only moves when a project owner actually reviews and
            marks your work done, inside that project's Project Room.
          </p>
        </div>
      </div>
    </div>
  )
}
