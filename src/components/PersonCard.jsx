import React from 'react'
import { TrendingUp } from 'lucide-react'
import MatchBadge from './MatchBadge.jsx'
import SkillChip from './SkillChip.jsx'

export default function PersonCard({ person, onInvite, invited }) {
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img src={person.avatar_url} alt={person.full_name} className="h-11 w-11 rounded-full border border-gridline object-cover" />
          <div>
            <p className="font-display text-sm font-semibold text-blueprint-900">{person.full_name}</p>
            <p className="text-xs text-ink/50">@{person.github_username}</p>
          </div>
        </div>
        <MatchBadge percent={person.match_percent} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {person.skills.map((s) => (
          <SkillChip key={s}>{s}</SkillChip>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-ink/60">
        <span className="flex items-center gap-1">
          <TrendingUp size={13} /> Contribution score {person.contribution_score}
        </span>
        <span>{person.completed_projects} completed · {person.active_projects} active</span>
      </div>

      <button
        onClick={() => onInvite(person)}
        disabled={invited}
        className={invited ? 'btn-secondary !cursor-default text-xs' : 'btn-primary text-xs'}
      >
        {invited ? 'Invited' : 'Invite'}
      </button>
    </div>
  )
}
