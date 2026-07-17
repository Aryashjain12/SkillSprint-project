import React from 'react'

export default function MatchBadge({ percent }) {
  const tone =
    percent >= 85 ? 'bg-moss-light text-moss border-moss/30'
    : percent >= 70 ? 'bg-amber-light text-amber border-amber/30'
    : 'bg-blueprint-50 text-blueprint-700 border-blueprint-700/20'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {percent}% match
    </span>
  )
}
