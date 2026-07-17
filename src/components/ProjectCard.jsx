import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'
import MatchBadge from './MatchBadge.jsx'
import SkillChip from './SkillChip.jsx'

export default function ProjectCard({ project, onRequestJoin, joinStatus }) {
  const filled = project.member_count ?? project.members?.length ?? 0
  const slotsOpen = Math.max(0, project.team_size - filled)
  const isFull = slotsOpen === 0

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold leading-snug text-blueprint-900">
          {project.title}
        </h3>
        {typeof project.match_percent === 'number' && <MatchBadge percent={project.match_percent} />}
      </div>

      <p className="line-clamp-2 text-sm text-ink/70">{project.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {project.required_skills.map((s) => (
          <SkillChip key={s}>{s}</SkillChip>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-ink/50">
        <span className="flex items-center gap-1"><Users size={13} /> {filled}/{project.team_size} filled</span>
        <span className="flex items-center gap-1"><Clock size={13} /> {project.timeline}</span>
        <span className={`font-semibold ${isFull ? 'text-ink/40' : 'text-moss'}`}>
          {isFull ? 'Team full' : `${slotsOpen} ${slotsOpen === 1 ? 'spot' : 'spots'} open`}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-gridline pt-3">
        <div className="flex items-center gap-2">
          <img src={project.owner.avatar_url} alt="" className="h-6 w-6 rounded-full border border-gridline" />
          <span className="text-xs text-ink/60">{project.owner.full_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/discover/${project.id}`} className="text-xs font-semibold text-blueprint-700 hover:underline">
            View details
          </Link>
          {joinStatus === 'requested' ? (
            <span className="btn-secondary !cursor-default !px-3 !py-1.5 text-xs">Request sent</span>
          ) : (
            onRequestJoin && !isFull && (
              <button onClick={() => onRequestJoin(project)} className="btn-primary !px-3 !py-1.5 text-xs">
                Request to join
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
