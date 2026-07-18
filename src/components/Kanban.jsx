import React, { useState } from 'react'
import { ArrowRight, CheckCircle2, Circle, PlusCircle, RotateCcw, Timer } from 'lucide-react'

const columns = [
  { key: 'todo', label: 'To Do', icon: Circle, tint: 'text-ink/40' },
  { key: 'inProgress', label: 'In Progress', icon: Timer, tint: 'text-amber' },
  { key: 'done', label: 'Done', icon: CheckCircle2, tint: 'text-moss' }
]

export default function Kanban({ tasks, isOwner, currentUserId, ownerId, members, onAddTask, onMoveTask, onReviewTask, onRequestChanges }) {
  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState(members?.[0]?.id || '')

  function submit(e) {
    e.preventDefault()
    if (!title.trim() || !assigneeId) return
    const assignee = members.find((m) => m.id === assigneeId)
    onAddTask({ title: title.trim(), assigneeId, assigneeName: assignee?.full_name || 'Unassigned' })
    setTitle('')
  }

  
  function canMove(task) {
    return isOwner || task.assigneeId === currentUserId
  }

  
  function canReview(task) {
    const isOwnersOwnTask = task.assigneeId === ownerId
    if (isOwnersOwnTask) return currentUserId !== ownerId
    return isOwner
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {columns.map((col) => {
        const Icon = col.icon
        const items = tasks[col.key] || []
        return (
          <div key={col.key} className="rounded-xl border border-gridline bg-white/60 p-3">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blueprint-900">
              <Icon size={16} className={col.tint} /> {col.label}
              <span className="ml-auto text-xs font-normal text-ink/40">{items.length}</span>
            </div>

            <div className="flex flex-col gap-2">
              {items.map((t) => (
                <div key={t.id} className="rounded-lg border border-gridline bg-white p-2.5 text-sm">
                  <p className="font-medium text-ink">{t.title}</p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-ink/50">Assigned to {t.assignee}</span>

                    {col.key === 'todo' && canMove(t) && (
                      <button onClick={() => onMoveTask(t.id, 'todo', 'inProgress')} className="flex items-center gap-1 text-[11px] font-semibold text-amber hover:underline">
                        Start <ArrowRight size={11} />
                      </button>
                    )}

                    {col.key === 'inProgress' && canMove(t) && (
                      <button onClick={() => onMoveTask(t.id, 'inProgress', 'done')} className="flex items-center gap-1 text-[11px] font-semibold text-moss hover:underline">
                        Mark done <ArrowRight size={11} />
                      </button>
                    )}

                    {col.key === 'done' && (
                      t.reviewed ? (
                        <span className="text-[11px] font-semibold text-moss">+score reviewed</span>
                      ) : canReview(t) ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => onRequestChanges(t.id)} className="flex items-center gap-1 text-[11px] font-semibold text-ink/50 hover:text-signal">
                            <RotateCcw size={11} /> Needs changes
                          </button>
                          <button onClick={() => onReviewTask(t.id)} className="text-[11px] font-semibold text-moss hover:underline">
                            Done
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber">Awaiting review</span>
                      )
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-xs text-ink/30">Nothing here yet.</p>}
            </div>

            {col.key === 'todo' && isOwner && (
              <form onSubmit={submit} className="mt-3 flex flex-col gap-1.5">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title…"
                  className="input !py-1.5 text-xs"
                />
                <div className="flex items-center gap-1.5">
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="input !py-1.5 text-xs"
                  >
                    {(members || []).map((m) => (
                      <option key={m.id} value={m.id}>{m.full_name}</option>
                    ))}
                  </select>
                  <button type="submit" className="shrink-0 text-blueprint-700 hover:text-signal">
                    <PlusCircle size={18} />
                  </button>
                </div>
              </form>
            )}
          </div>
        )
      })}
    </div>
  )
}
