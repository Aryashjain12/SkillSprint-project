import { supabase } from './supabaseClient'

async function unwrapFunctionError(error) {
  if (error?.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.json()
      if (body?.error) return new Error(body.error)
    } catch {
    }
  }
  return error
}


export async function matchTeammates({ projectDescription, requiredSkills, candidates }) {
  const { data, error } = await supabase.functions.invoke('embed-match', {
    body: { projectDescription, requiredSkills, candidates }
  })
  if (error) throw await unwrapFunctionError(error)
  return data.matches
}


export async function matchProjectsForUser({ userSkills, userBio, projects }) {
  const { data, error } = await supabase.functions.invoke('embed-match', {
    body: { mode: 'match_projects', userSkills, userBio, projects }
  })
  if (error) throw await unwrapFunctionError(error)
  return data.matches
}


export async function suggestProjectDetails({ title, description }) {
  const { data, error } = await supabase.functions.invoke('embed-match', {
    body: { mode: 'suggest', title, description }
  })
  if (error) throw await unwrapFunctionError(error)
  return data.suggestions
}
