import React, { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext.jsx'

export default function Chat({ projectId, initialMessages = [] }) {
  const { profile } = useAuth()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`project-chat-${projectId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [projectId])

  async function sendMessage(e) {
    e.preventDefault()
    if (!draft.trim()) return
    await supabase.from('messages').insert({
      project_id: projectId,
      author: profile?.full_name,
      avatar_url: profile?.avatar_url,
      text: draft.trim()
    })
    setDraft('')
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-gridline bg-white">
      <div className="border-b border-gridline px-4 py-3 text-sm font-semibold text-blueprint-900">Team chat</div>
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <div key={m.id} className="flex items-start gap-2">
            <img src={m.avatar_url} alt="" className="h-7 w-7 rounded-full border border-gridline object-cover" />
            <div>
              <p className="text-xs font-semibold text-blueprint-900">{m.author}</p>
              <p className="text-sm text-ink/80">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-gridline p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type message…"
          className="input !py-2 text-sm"
        />
        <button type="submit" className="btn-primary !px-3 !py-2">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
