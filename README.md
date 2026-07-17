# SkillSprint

Build your dream tech team with AI. Connect GitHub, list your skills, and let
AI match you to teammates and side projects worth shipping.

**Stack:** React (Vite) · Tailwind CSS · React Router · Supabase (Auth, Postgres, Realtime) · GitHub OAuth + REST API · Google Gemini `gemini-embedding-2` + `gemini-3.1-flash-lite` · pgvector · Lucide React.

This build has **no demo/offline mode** — the app requires a real Supabase
project, a GitHub OAuth App, and the AI Edge Function to be deployed before
it will run at all (`src/lib/supabaseClient.js` throws on start if the env
vars are missing). Follow the steps below in order.

---

## 1. Create the Supabase project

1. Create a project at https://supabase.com/dashboard.
2. In the SQL editor, run `supabase/schema.sql` — creates all tables, enables
   `pgvector`, sets up Row Level Security, and adds the `trg_enforce_team_size`
   trigger that stops a project going over its `team_size`.
3. Run `supabase/seed.sql` — this is what makes the app usable from minute
   one (see "Day one" below). It's plain SQL against your own tables, not
   client-side fake data, so it shows up exactly like real user content.
4. Grab your Project URL and anon public key: Project Settings → API.

## 2. Configure the app

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

## 3. Register a GitHub OAuth App

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Homepage URL: your deployed URL (or `http://localhost:5173` for local dev).
3. Authorization callback URL: the one shown at Supabase → Auth → Providers →
   GitHub (usually `https://xxxx.supabase.co/auth/v1/callback`).
4. Copy the Client ID + Client Secret into Supabase → Auth → Providers →
   GitHub, and toggle the provider on. The app requests `read:user repo`
   scope so it can read both public and private repo counts.

## 4. Deploy the AI matching Edge Function

The Gemini key must never reach the browser, so all embeddings are generated
server-side in `supabase/functions/embed-match`. Get a free key at
https://aistudio.google.com/apikey (no credit card needed for the free tier).

```bash
supabase functions deploy embed-match
supabase secrets set GEMINI_API_KEY=AI...
```

This one function backs three features, selected by a `mode` field in the
request body (see `src/lib/aiMatch.js`):
- **AI Teammate Matching** (default mode) — embeds the project brief and
  each candidate's skill/history text with `gemini-embedding-2`, ranks
  by cosine similarity blended with contribution score and workload.
  Genuinely open-ended: no hardcoded list anything is compared against.
- **`mode: 'match_projects'`** — powers "AI Recommended For You" on Discover
  Projects: embeds the signed-in user's skills/bio against each project,
  same embedding model, same open-ended similarity scoring.
- **`mode: 'suggest'`** — powers "AI Suggestions" on Post Project. This one
  uses `gemini-2.5-flash-lite` (a generative model, not just embeddings)
  to directly write out suggested skills/difficulty/team size as JSON.
  It used to rank a fixed 9-skill shortlist by embedding similarity, which
  meant it could never suggest anything outside that list — e.g. typing
  "AI resume analyzer" could never surface "API"/"NLP" even though those
  were clearly relevant, since neither was one of the 9 options. Asking a
  generative model directly removes that ceiling.

## 5. Run it

```bash
npm run dev
```

If any of steps 1–4 are incomplete, the app fails fast with a clear error
(missing env vars) or Supabase/GitHub returns an auth error — it will not
silently fall back to fake data, by design.

---

## 6. Day one: how people actually start using it

There are no users yet, so here's exactly what happens from a cold start:

1. **You run `seed.sql`** — inserts a handful of projects and candidate
   profiles directly into your real `projects` / `profiles` tables, so
   Discover Projects and AI Teammate Matching aren't empty the moment you
   launch. These aren't tied to real `auth.users` rows, so they're
   display/matching data only — nobody can "log in" as them.
2. **A real person signs in** with "Continue with GitHub" → Supabase Auth
   creates their `auth.users` row → `AuthContext.jsx`'s `syncProfile()`
   effect fires automatically, pulls their GitHub profile + repo languages,
   and upserts a real row into `profiles`. Zero manual setup per user.
   - **First login** (no `profiles` row existed yet) → redirected to
     **Profile**, so they can review/edit their skills and save before
     going further.
   - **Every login after that** → redirected straight to **Dashboard**,
     skipping Profile entirely.
3. **They add skills** on the Profile page → written to their `profiles` row.
4. **They post a project** on Post Project → `createProject()` inserts into
   `projects` with `status: 'recruiting'` → it appears immediately for
   every other signed-in user on Discover Projects (and in AI Teammate
   Matching once they open it).
5. **Other users request to join**, or the owner invites people from AI
   Teammate Matching → both flows write real rows (`project_members`,
   `invitations`) — see the table below.
6. **Once a team is together**, the owner assigns tasks in that project's
   Project Room, reviews finished work, and contribution scores update in
   `profiles` for real, visible on Profile and in Project Room headers.

From that point on, the seeded rows from step 1 and real user-created
projects are indistinguishable in the UI — same table, same queries.

---

## 7. What every button actually does

| Action | Function | Backend |
|---|---|---|
| GitHub sign-in + profile sync | `AuthContext.jsx` | Supabase Auth + GitHub REST API |
| Post Project → AI Suggestions | `suggestProjectDetails()` | `embed-match` Edge Function |
| AI Teammate Matching ranking | `matchTeammates()` | `embed-match` Edge Function |
| Discover Projects recommendations | `matchProjectsForUser()` | `embed-match` Edge Function |
| Invite (AI Teammate Matching) | `sendInvitation()` | inserts into `invitations` (type `invite`) |
| Accept / Decline invites (Dashboard + Project Details) | `respondToInvitation()` | updates `invitations`; on accept, adds the right person to `project_members` (see below) |
| Request to Join (Discover / Project Details) | `sendJoinRequest()` | inserts into `invitations` (type `request`), addressed to the project owner — does **not** join immediately |
| Assign task to a member (Project Room) | `addTask()` | inserts into `tasks` |
| Mark reviewed → contribution score | `markTaskReviewed()` + `bumpContributionScore()` | updates `tasks` + `profiles` |
| Team chat | `Chat.jsx` | Supabase Realtime on `messages` |

Two behaviors worth knowing:
- **Invitations now have a `type`**: `'invite'` (owner → candidate, the
  candidate must accept) or `'request'` (candidate → owner, the owner must
  approve). Both land in the same inbox — Dashboard's "Recent Invitations"
  shows `to_user_id`'s pending rows regardless of type, labeled differently
  ("Invited by X" vs "X wants to join"). `respondToInvitation()` reads the
  invitation's `type` to figure out who actually joins on accept: the
  `to_user_id` for an invite, the `from_user_id` for a request. Neither
  `sendInvitation()` nor `sendJoinRequest()` touches `project_members`
  directly — only an accepted invitation does.
- **Team size is enforced in Postgres**, not just hidden in the UI: the
  `trg_enforce_team_size` trigger on `project_members` rejects an insert
  once a project already has `team_size` members, so it can't overflow
  even via a direct API call — this now fires at accept time (when the
  actual `project_members` row is inserted), not at request time.
- **`getJoinStatuses()`** tells Discover Projects and Project Details
  whether the current user already owns/belongs to a project (hides it
  from Explore/Recommended entirely — including your own posted projects,
  since the owner is always a `project_members` row) or already has a
  pending request out (shows "Request sent" instead of the button) —
  both persist correctly across a page refresh.

---

## 8. How contribution scoring works

There's no activity graph or vanity metric. A member's score only moves when:

1. The project owner assigns a task to a specific member (by name, via the
   dropdown in the To Do column of a Project Room's Kanban board)
2. That task moves To Do → In Progress → Done — either the owner or the
   task's own assignee can move it forward a column at each stage
3. Whoever's reviewing clicks **"Done"** on it (not **"Needs changes"**,
   which sends it back to In Progress with no score change — for when the
   work isn't actually finished yet)

Reviewing is normally the owner's job. The one exception: if the owner
assigned a task to **themselves**, they can't fairly review their own
work, so any other project member can click Done/Needs changes on it
instead (`canReview()` in `Kanban.jsx`).

`bumpContributionScore()` then writes the new score straight to
`profiles.contribution_score`: **+8** for the assignee whose task was
reviewed, and **+3** for the owner too (for the review/management work
itself) — unless the owner is also the assignee, in which case they just
get the one bump. It's shown in three places that all read the same
field: the member chips in Project Room's header, the Profile page, and
the teammate cards on AI Teammate Matching.

Every profile starts at **50** — a neutral baseline (`AuthContext.jsx`'s
`syncProfile()`, `existing?.contribution_score ?? 50`) rather than 0, so a
brand-new member doesn't look like they're already failing before they've
done anything. Change that default (and the matching one in
`schema.sql`'s `contribution_score int default 50`) if you'd rather
everyone start at 0.

---

## 9. Project structure

```
src/
  pages/         Login, Profile, Dashboard, PostProject, AIMatching,
                 DiscoverProjects, ProjectDetails, MyProjects, ProjectRoom
  components/    Navbar, ProjectCard, PersonCard, Kanban, Chat, SkillChip...
  context/       AuthContext.jsx — GitHub OAuth session
  lib/           supabaseClient, github (REST API), aiMatch, projects
supabase/
  schema.sql               tables, RLS, pgvector indexes, team-size trigger
  seed.sql                 real seed data for day-one Discover/Matching
  functions/embed-match/   Gemini + pgvector matching Edge Function
```

## 10. Upgrading an existing database

If you already ran `schema.sql` once, you don't need to drop everything —
just apply what's new:

```sql
-- 1. Join requests now go through owner approval instead of joining
--    instantly (see section 7 below).
alter table invitations add column if not exists type text not null default 'invite'
  check (type in ('invite', 'request'));

-- 2. Real completed/active project counts for AI Teammate Matching
--    (replaces the undefined placeholders it used to show).
create or replace view profiles_with_stats as
select
  p.*,
  coalesce(count(pm.id) filter (where pr.status = 'completed'), 0) as completed_projects,
  coalesce(count(pm.id) filter (where pr.status is distinct from 'completed'), 0) as active_projects
from profiles p
left join project_members pm on pm.user_id = p.id
left join projects pr on pr.id = pm.project_id
group by p.id;

grant select on profiles_with_stats to authenticated, anon;
```

Then redeploy the Edge Function (it changed too — CORS headers + sequential
embedding calls to respect Gemini's free-tier rate limit):
```bash
supabase functions deploy embed-match
```

## 11. Troubleshooting

**Gemini model names change fast — this is the most likely recurring
failure.** Google has deprecated multiple models used by this project
within months of each other (the original `text-embedding-3-small`→
`gemini-embedding-001` switch, then `gemini-embedding-001` itself hit its
scheduled shutdown, and `gemini-2.5-flash-lite` became unavailable to new
API users). If either `EMBED_URL` or `GENERATE_URL` in
`supabase/functions/embed-match/index.ts` ever returns a 404 with a
message like "no longer available" or "not found":
1. Check the current model list at https://ai.google.dev/gemini-api/docs/models
   and the deprecation schedule at https://ai.google.dev/gemini-api/docs/deprecations
2. Swap in whatever the current free-tier Flash / Flash-Lite (generation)
   and Gemini Embedding (embeddings) model names are
3. Redeploy: `supabase functions deploy embed-match`

Thanks to the error-unwrapping fix in `src/lib/aiMatch.js`
(`unwrapFunctionError()`), a bad model name now shows up as the actual
404 message on the page — not a generic "non-2xx status code" — so this
should be easy to spot going forward.

If AI Teammate Matching shows no candidates, Post Project's "Suggest for
me" never returns, or Discover Projects quietly falls back to unranked
projects — these all fail for the same reason: **the `embed-match` Edge
Function isn't reachable.** Check, in order:

0. **Most common cause: missing CORS headers.** A browser calling an Edge
   Function sends an OPTIONS preflight first; without
   `Access-Control-Allow-Origin` on every response (including the OPTIONS
   one), the browser blocks the call before your code even runs — this
   looks exactly like "deployed fine, secret is set, still doesn't work."
   This version's `index.ts` already handles it; if you're upgrading from
   an earlier copy, redeploy: `supabase functions deploy embed-match`.

1. Did you run `supabase functions deploy embed-match` after the latest
   code change? Redeploy it — the function content changes over time
   (e.g. the Gemini switch).
2. Is `GEMINI_API_KEY` actually set? `supabase secrets list` should show
   it. If missing: `supabase secrets set GEMINI_API_KEY=AI...`
3. Check the function's logs in the Supabase dashboard (Edge Functions →
   embed-match → Logs) for the actual error — as of this version, errors
   are returned to the browser too (check the browser console / the error
   text now shown directly on the Matching and Post Project pages instead
   of failing silently).

If **Request to Join** fails with "could not send request" (or any
join/invite action), the exact reason is now shown instead of a generic
message (`describeJoinError()` in `src/lib/projects.js`) — team full,
duplicate request, or your profile not finished syncing yet (rare; wait a
few seconds after first login and retry).

If **My Projects** is empty after posting a project, make sure you're on
this version of `createProject()` — it inserts the owner into
`project_members` automatically now. On an existing database, a project
posted before this fix won't have that row; add it manually:
```sql
insert into project_members (project_id, user_id, role)
values ('<project-id>', '<your-user-id>', 'owner');
```

## 12. Design notes

Palette and type were chosen to avoid the generic "AI app" look (dark UI,
purple gradients): a light blueprint-paper background, deep navy display
type (Space Grotesk), warm coral for primary actions, and a signature
"contribution-graph" grid motif echoing GitHub's own heatmap — since the
whole product is about turning contribution history into team matches.
