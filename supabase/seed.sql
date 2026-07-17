-- SkillSprint — demo seed data
-- Run AFTER schema.sql. Safe to re-run (uses fixed UUIDs + upserts).
-- Note: these profile rows are NOT linked to real auth.users, so they're
-- for display/matching only (recruiters/owners/candidates in demo cards).
-- Your own profile row is created automatically on first GitHub login.

insert into profiles (id, github_username, full_name, avatar_url, bio, repo_count, skills, contribution_score)
values
  ('11111111-1111-1111-1111-111111111111', 'devp', 'Dev Patel', 'https://avatars.githubusercontent.com/u/5566778?v=4', 'Mobile-first builder.', 21, '{"React Native","Firebase","JavaScript"}', 74),
  ('22222222-2222-2222-2222-222222222222', 'saraiqbal', 'Sara Iqbal', 'https://avatars.githubusercontent.com/u/2233445?v=4', 'ML engineer, coffee enthusiast.', 40, '{"Python","Machine Learning","FastAPI"}', 88),
  ('33333333-3333-3333-3333-333333333333', 'kevz', 'Kevin Zhao', 'https://avatars.githubusercontent.com/u/3344556?v=4', 'Backend & infra.', 18, '{"Node.js","PostgreSQL","Docker"}', 69),
  ('44444444-4444-4444-4444-444444444444', 'meeran', 'Meera Nair', 'https://avatars.githubusercontent.com/u/4455667?v=4', 'Product-minded frontend dev.', 25, '{"React Native","Firebase","UI/UX"}', 71),
  ('55555555-5555-5555-5555-555555555555', 'rohanm', 'Rohan Mehta', 'https://avatars.githubusercontent.com/u/1234567?v=4', 'TypeScript everywhere.', 30, '{"React","TypeScript","Figma"}', 74),
  ('66666666-6666-6666-6666-666666666666', 'priyad', 'Priya Deshmukh', 'https://avatars.githubusercontent.com/u/6677889?v=4', 'Data engineer, loves clean pipelines.', 27, '{"Python","PostgreSQL","Airflow"}', 79),
  ('77777777-7777-7777-7777-777777777777', 'arjunv', 'Arjun Varma', 'https://avatars.githubusercontent.com/u/7788990?v=4', 'Game dev turned web dev.', 15, '{"Unity","C#","React"}', 58),
  ('88888888-8888-8888-8888-888888888888', 'nehas', 'Neha Sharma', 'https://avatars.githubusercontent.com/u/8899001?v=4', 'DevOps + platform engineering.', 33, '{"Docker","Kubernetes","AWS"}', 81),
  ('99999999-9999-9999-9999-999999999999', 'aaravk', 'Aarav Kapoor', 'https://avatars.githubusercontent.com/u/9900112?v=4', 'iOS native, dabbling in Flutter.', 22, '{"Swift","Flutter","UI/UX"}', 66),
  ('a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'ishitab', 'Ishita Bose', 'https://avatars.githubusercontent.com/u/1011121?v=4', 'Security-minded backend engineer.', 29, '{"Node.js","Security","PostgreSQL"}', 77)
on conflict (id) do update set
  full_name = excluded.full_name, avatar_url = excluded.avatar_url, skills = excluded.skills;

insert into projects (id, title, description, required_skills, team_size, timeline, difficulty, status, owner_id, repo_url, progress)
values
  ('a1111111-0000-0000-0000-000000000001', 'CampusEats — Hostel Food Ordering App',
   'A mobile-first ordering platform for campus mess halls with live queue tracking, so students skip the line for pickup slots.',
   '{"React Native","Firebase","Node.js"}', 4, '6 weeks', 'Intermediate', 'in_progress',
   '11111111-1111-1111-1111-111111111111', 'https://github.com/skillsprint-demo/campuseats', 40),
  ('a2222222-0000-0000-0000-000000000002', 'GreenGrid — Solar Yield Predictor',
   'ML pipeline that predicts rooftop solar yield from weather history and panel orientation, exposed through a simple dashboard.',
   '{"Python","Machine Learning","PostgreSQL"}', 3, '4 weeks', 'Advanced', 'recruiting',
   '22222222-2222-2222-2222-222222222222', 'https://github.com/skillsprint-demo/greengrid', 15),
  ('a3333333-0000-0000-0000-000000000003', 'DevMatch CLI',
   'A terminal tool that scans a repo, extracts its tech stack, and suggests open-source issues suited to a contributor''s skill level.',
   '{"Node.js","TypeScript","CLI Tools"}', 2, '3 weeks', 'Beginner', 'recruiting',
   '33333333-3333-3333-3333-333333333333', 'https://github.com/skillsprint-demo/devmatch-cli', 60),
  ('a4444444-0000-0000-0000-000000000004', 'ShelfSense — Library Shelf Scanner',
   'Computer-vision prototype that reads shelf photos and flags misplaced books using a lightweight on-device model.',
   '{"Python","Computer Vision","React"}', 5, '8 weeks', 'Advanced', 'recruiting',
   '44444444-4444-4444-4444-444444444444', 'https://github.com/skillsprint-demo/shelfsense', 5),
  ('a5555555-0000-0000-0000-000000000005', 'PipelineWatch — Data Pipeline Monitor',
   'Dashboard that watches Airflow DAGs and Postgres job health, alerting the team the moment a nightly pipeline fails.',
   '{"Python","PostgreSQL","Airflow"}', 3, '5 weeks', 'Intermediate', 'recruiting',
   '66666666-6666-6666-6666-666666666666', 'https://github.com/skillsprint-demo/pipelinewatch', 10),
  ('a6666666-0000-0000-0000-000000000006', 'QuestForge — 2D Platformer Toolkit',
   'A Unity toolkit for indie devs to prototype 2D platformers faster, with reusable physics and level-editor components.',
   '{"Unity","C#"}', 3, '6 weeks', 'Intermediate', 'recruiting',
   '77777777-7777-7777-7777-777777777777', 'https://github.com/skillsprint-demo/questforge', 20),
  ('a7777777-0000-0000-0000-000000000007', 'ClusterBoard — Kubernetes Cost Dashboard',
   'Visualizes per-namespace Kubernetes spend on AWS so small teams can spot cost spikes before the bill arrives.',
   '{"Kubernetes","AWS","Docker"}', 4, '6 weeks', 'Advanced', 'recruiting',
   '88888888-8888-8888-8888-888888888888', 'https://github.com/skillsprint-demo/clusterboard', 0),
  ('a8888888-0000-0000-0000-000000000008', 'PocketRecipe — Offline-First Recipe App',
   'A Flutter recipe app that works fully offline, syncing changes once you''re back online — built for spotty hostel wifi.',
   '{"Flutter","UI/UX"}', 3, '5 weeks', 'Beginner', 'recruiting',
   '99999999-9999-9999-9999-999999999999', 'https://github.com/skillsprint-demo/pocketrecipe', 35),
  ('a9999999-0000-0000-0000-000000000009', 'AuthGuard — Self-Hosted Auth Starter',
   'A drop-in authentication service with rate limiting and audit logs, for teams who don''t want to hand user data to a third party.',
   '{"Node.js","Security","PostgreSQL"}', 3, '7 weeks', 'Advanced', 'recruiting',
   'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'https://github.com/skillsprint-demo/authguard', 0),
  ('aa000000-0000-0000-0000-00000000000a', 'Notely — Collaborative Lecture Notes',
   'Real-time collaborative note-taking for lecture halls, with per-slide threads so questions don''t get lost in the scroll.',
   '{"React","TypeScript","Firebase"}', 3, '5 weeks', 'Intermediate', 'recruiting',
   '55555555-5555-5555-5555-555555555555', 'https://github.com/skillsprint-demo/notely', 25)
on conflict (id) do nothing;

insert into project_members (project_id, user_id, role)
values
  ('a1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('a1111111-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'member'),
  ('a2222222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'owner'),
  ('a3333333-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'owner'),
  ('a4444444-0000-0000-0000-000000000004', '44444444-4444-4444-4444-444444444444', 'owner'),
  ('a5555555-0000-0000-0000-000000000005', '66666666-6666-6666-6666-666666666666', 'owner'),
  ('a6666666-0000-0000-0000-000000000006', '77777777-7777-7777-7777-777777777777', 'owner'),
  ('a7777777-0000-0000-0000-000000000007', '88888888-8888-8888-8888-888888888888', 'owner'),
  ('a8888888-0000-0000-0000-000000000008', '99999999-9999-9999-9999-999999999999', 'owner'),
  ('a9999999-0000-0000-0000-000000000009', 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0', 'owner'),
  ('aa000000-0000-0000-0000-00000000000a', '55555555-5555-5555-5555-555555555555', 'owner')
on conflict do nothing;

insert into tasks (project_id, title, assignee, column_key, reviewed)
values
  ('a1111111-0000-0000-0000-000000000001', 'Design order-queue schema', 'Dev Patel', 'todo', false),
  ('a1111111-0000-0000-0000-000000000001', 'Wire push notifications', 'Rohan Mehta', 'todo', false),
  ('a1111111-0000-0000-0000-000000000001', 'Build vendor dashboard UI', 'Rohan Mehta', 'inProgress', false),
  ('a1111111-0000-0000-0000-000000000001', 'Set up Firebase auth', 'Dev Patel', 'done', true),
  ('a1111111-0000-0000-0000-000000000001', 'Scaffold React Native app', 'Dev Patel', 'done', false)
on conflict do nothing;

insert into messages (project_id, author, avatar_url, text)
values
  ('a1111111-0000-0000-0000-000000000001', 'Rohan Mehta', 'https://avatars.githubusercontent.com/u/1234567?v=4', 'Pushed the queue schema draft, can you review?'),
  ('a1111111-0000-0000-0000-000000000001', 'Dev Patel', 'https://avatars.githubusercontent.com/u/5566778?v=4', 'On it — looks solid, left two comments on the PR.'),
  ('a1111111-0000-0000-0000-000000000001', 'Rohan Mehta', 'https://avatars.githubusercontent.com/u/1234567?v=4', 'Fixed both, repushing now.');
