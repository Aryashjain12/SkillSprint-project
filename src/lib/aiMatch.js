import { supabase } from './supabaseClient'

/**
 * supabase-js's functions.invoke() throws a generic FunctionsHttpError
 * ("Edge Function returned a non-2xx status code") on any failure — the
 * actual reason (bad Gemini key, rate limit, malformed request, etc.) is
 * the JSON body our function returned, but it isn't parsed automatically.
 * This reads that body and re-throws with the real message so the UI can
 * show something useful instead of "non-2xx status code".
 */
async function unwrapFunctionError(error) {
  if (error?.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.json()
      if (body?.error) return new Error(body.error)
    } catch {
      // Response body wasn't JSON (or already consumed) — fall through
      // to the original error below.
    }
  }
  return error
}

/**
 * Invokes the `embed-match` Supabase Edge Function, which calls Google's
 * gemini-embedding-001 server-side (key never touches the browser),
 * embeds the project brief + each candidate's skill/bio text, and returns
 * candidates ranked by cosine similarity blended with contribution history.
 */
export async function matchTeammates({ projectDescription, requiredSkills, candidates }) {
  const { data, error } = await supabase.functions.invoke('embed-match', {
    body: { projectDescription, requiredSkills, candidates }
  })
  if (error) throw await unwrapFunctionError(error)
  return data.matches
}

/**
 * Powers "AI Recommended For You" on Discover Projects: ranks projects
 * against the signed-in user's skills/bio via the same Edge Function.
 */
export async function matchProjectsForUser({ userSkills, userBio, projects }) {
  const { data, error } = await supabase.functions.invoke('embed-match', {
    body: { mode: 'match_projects', userSkills, userBio, projects }
  })
  if (error) throw await unwrapFunctionError(error)
  return data.matches
}

/**
 * Powers "AI Suggestions" on Post Project — asks a generative Gemini model
 * (not just embeddings) for skills/difficulty/team size, open-ended.
 */
export async function suggestProjectDetails({ title, description }) {
  const { data, error } = await supabase.functions.invoke('embed-match', {
    body: { mode: 'suggest', title, description }
  })
  if (error) throw await unwrapFunctionError(error)
  return data.suggestions
}
