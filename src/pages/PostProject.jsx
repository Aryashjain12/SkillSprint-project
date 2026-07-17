import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import SkillChip from '../components/SkillChip.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { createProject } from '../lib/projects'
import { suggestProjectDetails } from '../lib/aiMatch'

const difficulties = ['Beginner', 'Intermediate', 'Advanced']

export default function PostProject() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '', required_skills: [], team_size: 3, timeline: '4 weeks', difficulty: 'Intermediate', repo_url: ''
  })
  const [skillDraft, setSkillDraft] = useState('')
  const [suggestions, setSuggestions] = useState(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestError, setSuggestError] = useState('')
  const [posting, setPosting] = useState(false)
  const [formError, setFormError] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function addSkill() {
    const s = skillDraft.trim()
    if (s && !form.required_skills.includes(s)) update('required_skills', [...form.required_skills, s])
    setSkillDraft('')
  }

  // Enter in the skill box should add a skill, not submit the whole
  // project — there is no nested <form> here anymore, so this has to be
  // handled explicitly instead of relying on a second submit handler.
  function handleSkillKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  async function getAiSuggestions() {
    if (!form.title.trim() && !form.description.trim()) return
    setLoadingSuggestions(true)
    setSuggestError('')
    try {
      const res = await suggestProjectDetails({ title: form.title, description: form.description })
      setSuggestions(res)
    } catch (err) {
      console.error('AI suggestions failed', err)
      setSuggestError(err.message || 'Could not fetch suggestions. Check that the embed-match Edge Function is deployed.')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  function applySuggestions() {
    if (!suggestions) return
    update('required_skills', [...new Set([...form.required_skills, ...suggestions.skills])])
    update('difficulty', suggestions.difficulty)
    update('team_size', suggestions.teamSize)
  }

  async function submit(e) {
    e.preventDefault()
    setFormError('')

    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.')
      return
    }
    if (form.required_skills.length === 0) {
      setFormError('Add at least one required skill.')
      return
    }

    setPosting(true)
    try {
      const project = await createProject({
        title: form.title.trim(),
        description: form.description.trim(),
        required_skills: form.required_skills,
        team_size: Number(form.team_size),
        timeline: form.timeline,
        difficulty: form.difficulty,
        repo_url: form.repo_url.trim() || null,
        owner_id: profile.id
      })
      navigate(`/ai-matching/${project.id}`, { state: { project } })
    } catch (err) {
      console.error('Failed to post project', err)
      setFormError(err.message || 'Could not post project — try again.')
      setPosting(false)
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Post a project</h1>
        <p className="mt-1 text-sm text-ink/60">Give a few details — AI will suggest skills, difficulty, and team size.</p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-5">
          <div>
            <label className="label">Project title</label>
            <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. CampusEats — Hostel Food Ordering App" className="input" />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              required rows={4}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="What are you building, and why does it matter?"
              className="input"
            />
          </div>

          <div>
            <label className="label">Required skills</label>
            {/* Plain div, not a nested <form> — nesting forms is invalid
                HTML and was causing this "Add" button to submit the whole
                project instead of just adding a skill. */}
            <div className="flex gap-2">
              <input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder="e.g. React"
                className="input"
              />
              <button type="button" onClick={addSkill} className="btn-secondary !px-4 text-sm">Add</button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.required_skills.map((s) => (
                <SkillChip key={s} onRemove={() => update('required_skills', form.required_skills.filter((x) => x !== s))}>{s}</SkillChip>
              ))}
              {form.required_skills.length === 0 && <p className="text-xs text-ink/40">Add at least one skill.</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Team size</label>
              <input type="number" min={2} max={10} value={form.team_size} onChange={(e) => update('team_size', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Timeline</label>
              <input value={form.timeline} onChange={(e) => update('timeline', e.target.value)} className="input" />
            </div>
            <div>
              <label className="label">Difficulty</label>
              <select value={form.difficulty} onChange={(e) => update('difficulty', e.target.value)} className="input">
                {difficulties.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">GitHub repo URL (optional)</label>
            <input
              type="url"
              value={form.repo_url}
              onChange={(e) => update('repo_url', e.target.value)}
              placeholder="https://github.com/your-username/your-repo"
              className="input"
            />
            <p className="mt-1 text-xs text-ink/40">
              You can add this later too — until then, Project Room links to your GitHub profile instead.
            </p>
          </div>

          <div className="card border-dashed">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-display font-semibold text-blueprint-900">
                <Sparkles size={16} className="text-signal" /> AI suggestions
              </p>
              <button type="button" onClick={getAiSuggestions} className="btn-secondary !px-3 !py-1.5 text-xs">
                {loadingSuggestions ? 'Thinking…' : 'Suggest for me'}
              </button>
            </div>
            {suggestError && <p className="mt-3 text-xs text-signal">{suggestError}</p>}
            {suggestions && (
              <div className="mt-3 space-y-2 text-sm text-ink/70">
                <p>Suggested skills: {suggestions.skills.join(', ')}</p>
                <p>Suggested difficulty: {suggestions.difficulty}</p>
                <p>Suggested team size: {suggestions.teamSize}</p>
                <button type="button" onClick={applySuggestions} className="text-xs font-semibold text-blueprint-700 hover:underline">
                  Apply to form
                </button>
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-signal">{formError}</p>}

          <button type="submit" disabled={posting} className="btn-primary w-full">
            {posting ? 'Posting…' : 'Post project'}
          </button>
        </form>
      </main>
    </div>
  )
}
