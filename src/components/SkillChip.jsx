import React from 'react'

export default function SkillChip({ children, onRemove }) {
  return (
    <span className="chip">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 text-blueprint-700/50 hover:text-signal" aria-label={`Remove ${children}`}>
          ×
        </button>
      )}
    </span>
  )
}
