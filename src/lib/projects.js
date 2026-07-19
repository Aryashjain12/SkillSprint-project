import { supabase } from './supabaseClient'

export async function listDiscoverProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, owner:profiles(*), project_members(count)')
    .eq('status', 'recruiting')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map((p) => ({ ...p, member_count: p.project_members?.[0]?.count ?? 0 }))
}

export async function getProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, owner:profiles(*), project_members(user:profiles(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return { ...data, members: (data.project_members || []).map((row) => row.user) }
}

export async function listMyProjects(userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select('project:projects(*, project_members(user:profiles(*)))')
    .eq('user_id', userId)
  if (error) throw error
  const all = data.map((row) => ({
    ...row.project,
    members: (row.project.project_members || []).map((m) => m.user)
  }))
  return {
    active: all.filter((p) => p.status !== 'completed'),
    completed: all.filter((p) => p.status === 'completed')
  }
}

export async function listInvitations(userId) {
  const { data, error } = await supabase
    .from('invitations')
    .select('*, from:profiles(*), project:projects(id, title)')
    .eq('to_user_id', userId)
    .eq('status', 'pending')
  if (error) throw error
  return data.map((inv) => ({ ...inv, project_title: inv.project?.title, project_id: inv.project?.id }))
}

export async function listCandidatePool() {
  const { data, error } = await supabase.from('profiles_with_stats').select('*')
  if (error) throw error
  return data
}

export async function createProject(payload) {
  const { data, error } = await supabase.from('projects').insert(payload).select().single()
  if (error) throw error


  const { error: memberError } = await supabase
    .from('project_members')
    .insert({ project_id: data.id, user_id: payload.owner_id, role: 'owner' })
  if (memberError) throw memberError

  return data
}

/**
 Owner marks a project finished — moves it from Active to Completed on
 My Projects.
 */
export async function completeProject(projectId) {
  const { error } = await supabase.from('projects').update({ status: 'completed', progress: 100 }).eq('id', projectId)
  if (error) throw error
}

export async function deleteProject(projectId) {
  const { error } = await supabase.from('projects').delete().eq('id', projectId)
  if (error) throw error
}

export async function getProjectTasks(projectId) {
  const { data, error } = await supabase.from('tasks').select('*').eq('project_id', projectId)
  if (error) throw error
  const mapped = data.map((t) => ({ id: t.id, title: t.title, assignee: t.assignee, assigneeId: t.assignee_id, reviewed: t.reviewed }))
  return {
    todo: data.filter((t) => t.column_key === 'todo').map((t) => mapped.find((m) => m.id === t.id)),
    inProgress: data.filter((t) => t.column_key === 'inProgress').map((t) => mapped.find((m) => m.id === t.id)),
    done: data.filter((t) => t.column_key === 'done').map((t) => mapped.find((m) => m.id === t.id))
  }
}

export async function addTask({ projectId, title, assigneeId, assigneeName }) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({ project_id: projectId, title, assignee: assigneeName, assignee_id: assigneeId, column_key: 'todo' })
    .select()
    .single()
  if (error) throw error
  return { id: data.id, title: data.title, assignee: data.assignee, assigneeId: data.assignee_id, reviewed: data.reviewed }
}


export async function moveTaskColumn(taskId, columnKey) {
  const { error } = await supabase.from('tasks').update({ column_key: columnKey }).eq('id', taskId)
  if (error) throw error
}

export async function markTaskReviewed(taskId) {
  const { error } = await supabase.from('tasks').update({ reviewed: true }).eq('id', taskId)
  if (error) throw error
}

export async function respondToInvitation({ invitationId, accept }) {
  const { data: invitation, error: fetchError } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single()
  if (fetchError) throw fetchError

  const { error: invError } = await supabase
    .from('invitations')
    .update({ status: accept ? 'accepted' : 'declined' })
    .eq('id', invitationId)
  if (invError) throw invError

  if (accept) {
    const memberId = invitation.type === 'request' ? invitation.from_user_id : invitation.to_user_id
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({ project_id: invitation.project_id, user_id: memberId, role: 'member' })
    if (memberError) throw memberError
  }
}


export async function sendInvitation({ projectId, fromUserId, toUserId, message }) {
  const { error } = await supabase
    .from('invitations')
    .insert({ project_id: projectId, from_user_id: fromUserId, to_user_id: toUserId, message, type: 'invite' })
  if (error) throw error
}


export async function sendJoinRequest({ projectId, fromUserId, toUserId, message }) {
  const { data, error } = await supabase
    .from('invitations')
    .insert({ project_id: projectId, from_user_id: fromUserId, to_user_id: toUserId, message, type: 'request' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}


export async function getJoinStatuses(userId) {
  const [{ data: memberships, error: e1 }, { data: pending, error: e2 }] = await Promise.all([
    supabase.from('project_members').select('project_id').eq('user_id', userId),
    supabase.from('invitations').select('id, project_id').eq('from_user_id', userId).eq('type', 'request').eq('status', 'pending')
  ])
  if (e1) throw e1
  if (e2) throw e2
  const requestedProjectMap = new Map((pending || []).map((r) => [r.project_id, r.id]))
  return {
    memberProjectIds: new Set((memberships || []).map((m) => m.project_id)),
    requestedProjectIds: new Set(requestedProjectMap.keys()),
    requestedProjectMap
  }
}
export async function cancelJoinRequest(invitationId) {
  const { error } = await supabase.from('invitations').delete().eq('id', invitationId)
  if (error) throw error
}

export function describeJoinError(err) {
  const msg = err?.message || ''
  if (msg.includes('already full')) return 'This team is already full.'
  if (err?.code === '23505' || msg.includes('duplicate key')) return "You've already requested to join this project."
  if (err?.code === '23503' || msg.includes('foreign key')) return "Your profile isn't fully set up yet — refresh and try again in a moment."
  if (msg.includes('row-level security') || msg.includes('policy')) return 'Not permitted — try signing out and back in.'
  return msg || 'Could not send request — try again.'
}

export async function getProjectMessages(projectId) {
  const { data, error } = await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at')
  if (error) throw error
  return data
}

export async function bumpContributionScore(userId, currentScore, delta = 8) {
  const nextScore = Math.min(100, currentScore + delta)
  const { error } = await supabase.from('profiles').update({ contribution_score: nextScore }).eq('id', userId)
  if (error) throw error
  return nextScore
}
