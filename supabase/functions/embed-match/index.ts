// SkillSprint — embed-match Edge Function
// Deploy with: supabase functions deploy embed-match
// Requires secrets: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (the last two are injected automatically by Supabase at deploy time)
//
// Uses Google's Gemini models (free tier available) instead of OpenAI —
// get a key at https://aistudio.google.com/apikey, then:
//   supabase secrets set GEMINI_API_KEY=AI...
//
// Two different Gemini capabilities are used here, for two different jobs:
// - gemini-embedding-2 (embeddings): for AI Teammate Matching and
//   Discover Projects recommendations — genuinely open-ended similarity
//   scoring, nothing hardcoded, works for any skills/text.
// - gemini-3.1-flash-lite (generateContent): for Post Project's "AI
//   Suggestions". This USED to rank a fixed 9-skill shortlist by embedding
//   similarity, which meant it could never suggest anything outside that
//   list (e.g. "API" for an AI resume analyzer) no matter how relevant.
//   Asking a generative model directly for skills removes that ceiling.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const EMBED_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent'
const GENERATE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getApiKey(): string {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY secret is not set. Run: supabase secrets set GEMINI_API_KEY=...')
  return apiKey
}

// The Gemini free tier has a strict requests-per-minute limit. Firing
// several calls at once with Promise.all() bursts straight past it —
// Gemini returns 429, which becomes a 500 from this function ("non-2xx
// status code" is exactly what supabase-js prints for that in the
// browser). Calling one at a time, with a small gap and retry/backoff on
// 429, keeps every request in a batch under the limit.
async function embed(text: string, attempt = 1): Promise<number[]> {
  const res = await fetch(`${EMBED_URL}?key=${getApiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'models/gemini-embedding-2',
      content: { parts: [{ text }] },
      // Matches the vector(1536) columns in schema.sql (Gemini defaults to
      // 3072 dims but supports truncating via Matryoshka representation).
      outputDimensionality: 1536
    })
  })

  if (res.status === 429 && attempt <= 3) {
    await sleep(attempt * 1000)
    return embed(text, attempt + 1)
  }
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini embedding request failed (${res.status}): ${detail}`)
  }
  const json = await res.json()
  return json.embedding.values
}

/** Runs embed() one text at a time instead of in parallel — see note above. */
async function embedSequential(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  for (const text of texts) {
    results.push(await embed(text))
    await sleep(120)
  }
  return results
}

/**
 * Asks Gemini directly for suggested skills/difficulty/team size, as JSON.
 * Genuinely open-ended — not limited to any predefined list.
 */
async function generateSuggestions(title: string, description: string, attempt = 1): Promise<any> {
  const prompt = `You are helping staff a software project. Given this project, suggest:
- "skills": an array of 3-5 specific technical skills/technologies actually needed (be specific — e.g. "OpenAI API" not just "AI", "PostgreSQL" not just "database" — and include any skill implied by the domain, like NLP/LLM APIs for AI-driven tools, payment APIs for checkout flows, etc.)
- "difficulty": one of "Beginner", "Intermediate", "Advanced"
- "teamSize": a number between 2 and 6

Project title: ${title}
Project description: ${description}

Respond with ONLY a JSON object in this exact shape, no markdown, no code fences, no explanation:
{"skills": ["...", "..."], "difficulty": "...", "teamSize": 3}`

  const res = await fetch(`${GENERATE_URL}?key=${getApiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' }
    })
  })

  if (res.status === 429 && attempt <= 3) {
    await sleep(attempt * 1000)
    return generateSuggestions(title, description, attempt + 1)
  }
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Gemini generateContent request failed (${res.status}): ${detail}`)
  }

  const json = await res.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no suggestion text.')

  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '')
  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Gemini's response wasn't valid JSON: ${text.slice(0, 300)}`)
  }
  return {
    skills: Array.isArray(parsed.skills) ? parsed.skills.slice(0, 5) : [],
    difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(parsed.difficulty) ? parsed.difficulty : 'Intermediate',
    teamSize: Math.min(6, Math.max(2, Number(parsed.teamSize) || 3))
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // ---- Mode 1: AI Suggestions on the Post Project form ----
    if (body.mode === 'suggest') {
      const { title, description } = body
      const suggestions = await generateSuggestions(title, description)
      return new Response(JSON.stringify({ suggestions }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ---- Mode 2: Discover Projects — rank projects against a user's skills/bio ----
    if (body.mode === 'match_projects') {
      const { userSkills, userBio, projects } = body
      const userText = `Skills: ${(userSkills || []).join(', ')}. ${userBio || ''}`
      const projectTexts = projects.map((p: any) => `${p.description}\nRequired skills: ${p.required_skills.join(', ')}`)
      const [userEmbedding, ...projectEmbeddings] = await embedSequential([userText, ...projectTexts])

      const matches = projects.map((p: any, i: number) => ({
        ...p,
        match_percent: Math.round(cosineSimilarity(userEmbedding, projectEmbeddings[i]) * 100)
      }))
      matches.sort((a: any, b: any) => b.match_percent - a.match_percent || String(a.id).localeCompare(String(b.id)))
      return new Response(JSON.stringify({ matches }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ---- Mode 3 (default): AI Teammate Matching ----
    const { projectDescription, requiredSkills, candidates } = body
    const projectText = `${projectDescription}\nRequired skills: ${requiredSkills.join(', ')}`
    const candidateTexts = candidates.map(
      (c: any) => `Skills: ${(c.skills || []).join(', ')}. Completed ${c.completed_projects ?? 0} projects, currently on ${c.active_projects ?? 0}.`
    )
    const [projectEmbedding, ...candidateEmbeddings] = await embedSequential([projectText, ...candidateTexts])

    const matches = candidates.map((c: any, i: number) => {
      const similarity = cosineSimilarity(projectEmbedding, candidateEmbeddings[i])
      const activeProjects = c.active_projects ?? 0
      const loadPenalty = Math.max(0, 1 - activeProjects * 0.15)
      const blended = similarity * 0.7 + ((c.contribution_score ?? 50) / 100) * 0.2 + loadPenalty * 0.1
      return { ...c, match_percent: Math.round(blended * 100) }
    })

    if (body.projectId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      await supabase.from('projects').update({ embedding: projectEmbedding }).eq('id', body.projectId)
    }

    matches.sort((a: any, b: any) => b.match_percent - a.match_percent || String(a.id).localeCompare(String(b.id)))
    return new Response(JSON.stringify({ matches }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
