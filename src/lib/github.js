const GITHUB_API = 'https://api.github.com'

/**
 * Parses a GitHub PR URL like https://github.com/owner/repo/pull/42
 * into its parts. Returns null if the URL doesn't match that shape.
 */
export function parsePRUrl(url) {
  if (!url) return null
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!match) return null
  const [, owner, repo, number] = match
  return { owner, repo, number: Number(number) }
}

/**
 * Verifies a PR is actually merged via the real GitHub REST API.
 * Requires the assignee's own OAuth provider token (from their Supabase
 * session) — without it (e.g. in Demo Mode) callers should treat the
 * verification step as simulated rather than calling this.
 */
export async function fetchPullRequest({ owner, repo, number }, token) {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json'
    }
  })
  if (!res.ok) throw new Error('Failed to fetch pull request')
  const pr = await res.json()
  return { merged: Boolean(pr.merged), mergedAt: pr.merged_at, title: pr.title, htmlUrl: pr.html_url }
}

export async function fetchGithubProfile(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json'
  }

  const userRes = await fetch(`${GITHUB_API}/user`, { headers })
  if (!userRes.ok) throw new Error('Failed to fetch GitHub profile')
  const user = await userRes.json()

  const reposRes = await fetch(`${GITHUB_API}/users/${user.login}/repos?per_page=100`, { headers })
  const repos = reposRes.ok ? await reposRes.json() : []

  // Infer candidate skills from the languages used across the user's repos.
  const languageCounts = {}
  repos.forEach((r) => {
    if (r.language) languageCounts[r.language] = (languageCounts[r.language] || 0) + 1
  })
  const inferredSkills = Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([lang]) => lang)

  return {
    github_username: user.login,
    full_name: user.name || user.login,
    avatar_url: user.avatar_url,
    bio: user.bio || '',
    repo_count: user.public_repos ?? repos.length,
    inferred_skills: inferredSkills
  }
}
