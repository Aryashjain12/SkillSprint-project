import { supabase } from './supabaseClient'

export async function listDiscoverProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, owner:profiles(*), project_members(count)')
    .eq('status', 'recruiting')
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

  // Without this, the owner never shows up in project_members — which
  // means their own posted project wouldn't appear on My Projects, and
  // Project Room's member list / task-assignee dropdown would be missing
  // them entirely.
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({ project_id: data.id, user_id: payload.owner_id, role: 'owner' })
  if (memberError) throw memberError

  return data
}

/**
 * Owner marks a project finished — moves it from Active to Completed on
 * My Projects.
 */
export async function completeProject(projectId) {
  const { error } = await supabase.from('projects').update({ status: 'completed', progress: 100 }).eq('id', projectId)
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

/**
 * Moves a task between columns (To Do → In Progress → Done). Allowed for
 * the project owner or the task's own assignee — enforced in the UI
 * (Kanban.jsx's canMove) since this is a small hackathon app without
 * per-row RLS distinguishing "my own assigned task" yet.
 */
export async function moveTaskColumn(taskId, columnKey) {
  const { error } = await supabase.from('tasks').update({ column_key: columnKey }).eq('id', taskId)
  if (error) throw error
}

export async function markTaskReviewed(taskId) {
  const { error } = await supabase.from('tasks').update({ reviewed: true }).eq('id', taskId)
  if (error) throw error
}

/**
 * Accept/Decline an invitation OR a join request. Reads the invitation
 * itself to figure out who should actually end up in project_members:
 * - type 'invite' (owner → candidate): the candidate (to_user_id) joins.
 * - type 'request' (candidate → owner): the requester (from_user_id)
 *   joins — the owner (to_user_id) is just the one approving it.
 */
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

/**
 * Owner invites a candidate to their project from AI Teammate Matching.
 */
export async function sendInvitation({ projectId, fromUserId, toUserId, message }) {
  const { error } = await supabase
    .from('invitations')
    .insert({ project_id: projectId, from_user_id: fromUserId, to_user_id: toUserId, message, type: 'invite' })
  if (error) throw error
}

/**
 * "Request to join" from Discover Projects / Project Details. This no
 * longer joins immediately — it creates a pending 'request' invitation
 * addressed to the project owner, who approves/declines it from their
 * Dashboard (or the project's Details page) just like any other
 * invitation. Actual membership only happens on accept, via
 * respondToInvitation() above.
 */
export async function sendJoinRequest({ projectId, fromUserId, toUserId, message }) {
  const { error } = await supabase
    .from('invitations')
    .insert({ project_id: projectId, from_user_id: fromUserId, to_user_id: toUserId, message, type: 'request' })
  if (error) throw error
}

/**
 * Tells the UI, for every project, whether the current user is already a
 * member (including projects they own) or already has a pending join
 * request out — so "Request to Join" doesn't reappear after a refresh,
 * and a project you're already part of doesn't show up as joinable.
 */
export async function getJoinStatuses(userId) {
  const [{ data: memberships, error: e1 }, { data: pending, error: e2 }] = await Promise.all([
    supabase.from('project_members').select('project_id').eq('user_id', userId),
    supabase.from('invitations').select('project_id').eq('from_user_id', userId).eq('type', 'request').eq('status', 'pending')
  ])
  if (e1) throw e1
  if (e2) throw e2
  return {
    memberProjectIds: new Set((memberships || []).map((m) => m.project_id)),
    requestedProjectIds: new Set((pending || []).map((r) => r.project_id))
  }
}

/**
 * Turns common Postgres errors from sendJoinRequest()/respondToInvitation()
 * into messages a person can actually act on, instead of a generic
 * "could not send request" for every possible failure.
 */
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

/**
 * Bumps a member's contribution score once the project owner marks their
 * reviewed task done.
 */
export async function bumpContributionScore(userId, currentScore, delta = 8) {
  const nextScore = Math.min(100, currentScore + delta)
  const { error } = await supabase.from('profiles').update({ contribution_score: nextScore }).eq('id', userId)
  if (error) throw error
  return nextScore
}
