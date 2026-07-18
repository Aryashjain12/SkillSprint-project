import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass, FolderKanban, LogOut, PlusCircle, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

function Logo() {

  const shades = ['bg-blueprint-100', 'bg-blueprint-300', 'bg-signal', 'bg-moss']
  const pattern = [1, 2, 0, 2, 3, 1, 0, 1, 2]
  return (
    <div className="grid grid-cols-3 gap-[3px]">
      {pattern.map((i, idx) => (
        <span key={idx} className={`h-[7px] w-[7px] rounded-[2px] ${shades[i]}`} />
      ))}
    </div>
  )
}

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: Sparkles },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/my-projects', label: 'My Projects', icon: FolderKanban },
  { to: '/post-project', label: 'Post Project', icon: PlusCircle }
]

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  return (
    <header className="sticky top-0 z-20 border-b border-gridline bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-display text-lg font-semibold tracking-tight text-blueprint-900">
            SkillSprint
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const Icon = l.icon
            const active = location.pathname === l.to
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-blueprint-50 text-blueprint-700' : 'text-ink/70 hover:bg-blueprint-50/60'
                }`}
              >
                <Icon size={16} /> {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/profile" className="flex items-center gap-2">
            <img
              src={profile?.avatar_url}
              alt={profile?.full_name}
              className="h-8 w-8 rounded-full border border-gridline object-cover"
            />
          </Link>
          <button onClick={signOut} className="text-ink/50 hover:text-signal" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
