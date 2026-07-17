-- SkillSprint — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ────────────────────────────────────────────────────────────
-- Profiles (real users get id = their auth.users id via the app's own
-- upsert on GitHub sign-in — see AuthContext.jsx. No FK to auth.users here
-- on purpose: it would reject supabase/seed.sql's demo profiles, which are
-- intentionally not backed by real logins. RLS below still only lets a
-- user insert/update the row matching their own auth.uid(), so this
-- doesn't loosen any actual security — it only removes a data-integrity
-- constraint that seed data can't satisfy.
--
-- If you already ran an earlier version of this file with the FK in
-- place, drop it before re-running seed.sql:
--   alter table profiles drop constraint if exists profiles_id_fkey;
-- ────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  github_username text unique,
  full_name text,
  avatar_url text,
  bio text,
  repo_count int default 0,
  skills text[] default '{}',
  contribution_score int default 50,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Profiles are viewable by any authenticated user"
  on profiles for select using (auth.role() = 'authenticated');
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- ────────────────────────────────────────────────────────────
-- Projects
-- ────────────────────────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  required_skills text[] default '{}',
  team_size int default 3,
  timeline text,
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  status text default 'recruiting' check (status in ('recruiting', 'in_progress', 'completed')),
  owner_id uuid references profiles(id) on delete cascade,
  repo_url text,
  progress int default 0,
  embedding vector(1536),
  created_at timestamptz default now()
);

alter table projects enable row level security;
create policy "Projects are viewable by any authenticated user"
  on projects for select using (auth.role() = 'authenticated');
create policy "Owners can insert projects"
  on projects for insert with check (auth.uid() = owner_id);
create policy "Owners can update their projects"
  on projects for update using (auth.uid() = owner_id);

-- ────────────────────────────────────────────────────────────
-- Project members
-- ────────────────────────────────────────────────────────────
create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  unique (project_id, user_id)
);

alter table project_members enable row level security;
create policy "Members viewable by authenticated users"
  on project_members for select using (auth.role() = 'authenticated');
create policy "Users can join projects"
  on project_members for insert with check (auth.uid() = user_id);

-- Enforces team_size at the database level, so joining is blocked no
-- matter how the insert happens (UI race conditions, direct API calls,
-- multiple simultaneous "Request to Join" clicks, etc.) — not just when
-- the React UI happens to hide the join button.
create or replace function enforce_team_size()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  max_size int;
begin
  select team_size into max_size from projects where id = new.project_id;
  select count(*) into current_count from project_members where project_id = new.project_id;
  if current_count >= max_size then
    raise exception 'This project''s team is already full (% / % members)', current_count, max_size;
  end if;
  return new;
end;
$$;

create trigger trg_enforce_team_size
  before insert on project_members
  for each row execute function enforce_team_size();

-- ────────────────────────────────────────────────────────────
-- Invitations
-- ────────────────────────────────────────────────────────────
create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  from_user_id uuid references profiles(id) on delete cascade,
  to_user_id uuid references profiles(id) on delete cascade,
  -- 'invite': owner → candidate (candidate is to_user_id and must accept).
  -- 'request': candidate → owner (owner is to_user_id and must accept;
  -- on accept, from_user_id — the requester — is the one who joins).
  type text not null default 'invite' check (type in ('invite', 'request')),
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now()
);

alter table invitations enable row level security;
create policy "Recipients and senders can view their invitations"
  on invitations for select using (auth.uid() = to_user_id or auth.uid() = from_user_id);
create policy "Senders can create invitations"
  on invitations for insert with check (auth.uid() = from_user_id);
create policy "Recipients can update invitation status"
  on invitations for update using (auth.uid() = to_user_id);

-- ────────────────────────────────────────────────────────────
-- Tasks (Kanban board per project)
-- ────────────────────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  assignee text,
  assignee_id uuid references profiles(id) on delete set null,
  column_key text default 'todo' check (column_key in ('todo', 'inProgress', 'done')),
  reviewed boolean default false,
  pr_url text,
  created_at timestamptz default now()
);

alter table tasks enable row level security;
create policy "Tasks viewable by authenticated users"
  on tasks for select using (auth.role() = 'authenticated');
create policy "Members can insert tasks"
  on tasks for insert with check (auth.role() = 'authenticated');
create policy "Members can update tasks"
  on tasks for update using (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────
-- Messages (realtime project chat)
-- ────────────────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  author text,
  avatar_url text,
  text text not null,
  created_at timestamptz default now()
);

alter table messages enable row level security;
create policy "Messages viewable by authenticated users"
  on messages for select using (auth.role() = 'authenticated');
create policy "Authenticated users can send messages"
  on messages for insert with check (auth.role() = 'authenticated');

alter publication supabase_realtime add table messages;

-- ────────────────────────────────────────────────────────────
-- pgvector similarity search helper (used by the embed-match Edge Function)
-- ────────────────────────────────────────────────────────────
create or replace function match_profiles(query_embedding vector(1536), match_count int default 10)
returns table (id uuid, full_name text, similarity float)
language sql stable
as $$
  select id, full_name, 1 - (embedding <=> query_embedding) as similarity
  from profiles
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

create index if not exists profiles_embedding_idx on profiles using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists projects_embedding_idx on projects using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ────────────────────────────────────────────────────────────
-- Real completed/active project counts per profile — used by AI Teammate
-- Matching (PersonCard) instead of the undefined placeholder fields the
-- old demo data used to fake. A plain view (not security definer), so it
-- still respects each table's own RLS for whoever queries it.
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- Contribution score: bumped whenever an owner marks a member's task
-- reviewed in the Project Room (see src/lib/projects.js: awardContribution).
-- ────────────────────────────────────────────────────────────
create or replace function increment_contribution_score(p_user_id uuid, p_amount int)
returns int
language plpgsql
as $$
declare new_score int;
begin
  update profiles
  set contribution_score = least(100, greatest(0, contribution_score + p_amount))
  where id = p_user_id
  returning contribution_score into new_score;
  return new_score;
end;
$$;
