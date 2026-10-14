-- Agency Board Task Tracker: multi-tenant schema, RLS, and auth/invite RPCs.
-- See /Users/macbookpro/.claude/plans/reactive-giggling-crown.md for the design rationale.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete restrict,
  created_at  timestamptz not null default now()
);

create table workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid references auth.users(id) on delete set null,
  email         citext not null,
  display_name  text not null,
  role          text not null default 'member' check (role in ('owner', 'member')),
  status        text not null default 'invited' check (status in ('invited', 'active')),
  invite_token  uuid not null default gen_random_uuid(),
  invited_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  joined_at     timestamptz,
  unique (workspace_id, email),
  unique (workspace_id, user_id)
);
create unique index workspace_members_invite_token_idx on workspace_members (invite_token);
create index workspace_members_user_id_idx on workspace_members (user_id);

create table board_columns (
  id                 text primary key,
  workspace_id       uuid not null references workspaces(id) on delete cascade,
  name               text not null,
  counts_as_complete boolean not null default false,
  position           integer not null,
  created_at         timestamptz not null default now()
);
create index board_columns_workspace_id_idx on board_columns (workspace_id);

-- Projects: top-level container that groups Tasks. Each project owns its own
-- timeline (start/target date), requirements, features, and a costed resource
-- list; its Tasks (with their own subtasks) are the project's kanban board.
create table projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  client       text not null default '',
  description  text not null default '',
  status       text not null default 'planning' check (status in ('planning', 'active', 'on_hold', 'completed')),
  start_date   date,
  target_date  date,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index projects_workspace_id_idx on projects (workspace_id);

create table project_features (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title        text not null,
  done         boolean not null default false,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);
create index project_features_workspace_id_idx on project_features (workspace_id);
create index project_features_project_id_idx on project_features (project_id);

create table project_requirements (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title        text not null,
  done         boolean not null default false,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);
create index project_requirements_workspace_id_idx on project_requirements (workspace_id);
create index project_requirements_project_id_idx on project_requirements (project_id);

-- Costed resource line items per project (e.g. "Freelance designer — $1,200").
-- Sum of `cost` across a project's rows is its total resource cost.
create table project_resources (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name         text not null,
  cost         numeric(12, 2) not null default 0,
  notes        text not null default '',
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);
create index project_resources_workspace_id_idx on project_resources (workspace_id);
create index project_resources_project_id_idx on project_resources (project_id);

-- Agency/workspace-wide tools & subscriptions (Figma, AWS, Slack, etc.) — distinct
-- from project_resources, which are one-off costed line items scoped to a project.
create table workspace_resources (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  category      text not null default 'other' check (category in ('software', 'hosting', 'marketing', 'finance', 'other')),
  cost          numeric(12, 2) not null default 0,
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly', 'yearly', 'weekly', 'one_time')),
  status        text not null default 'active' check (status in ('active', 'trial', 'cancelled')),
  renewal_date  date,
  url           text not null default '',
  notes         text not null default '',
  owner_id      uuid references workspace_members(id) on delete set null,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index workspace_resources_workspace_id_idx on workspace_resources (workspace_id);

-- Lightweight, append-only activity feed ("who did what"). Written directly by the
-- app at each meaningful mutation (not via DB triggers) so entries carry a
-- human-readable summary rather than raw row diffs. This is a team-visibility feed,
-- not a tamper-proof compliance audit log: RLS grants members insert+select only, no
-- update/delete, so entries can't be edited or erased once written from the client.
create table activity_log (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  actor_id     uuid references auth.users(id) on delete set null,
  actor_name   text not null,
  entity_type  text not null check (entity_type in ('task', 'project', 'column', 'member', 'resource', 'workspace')),
  summary      text not null,
  created_at   timestamptz not null default now()
);
create index activity_log_workspace_id_idx on activity_log (workspace_id, created_at desc);

create table tasks (
  id           text primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  name         text not null,
  client       text not null,
  desc         text not null default '',
  column_id    text not null references board_columns(id) on delete restrict,
  priority     text not null check (priority in ('High', 'Medium', 'Low')),
  deadline     date,
  stages       jsonb not null default '{}'::jsonb,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index tasks_workspace_id_idx on tasks (workspace_id);
create index tasks_column_id_idx on tasks (column_id);
create index tasks_project_id_idx on tasks (project_id);

create table task_assignees (
  task_id      text not null references tasks(id) on delete cascade,
  member_id    uuid not null references workspace_members(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  primary key (task_id, member_id)
);
create index task_assignees_workspace_id_idx on task_assignees (workspace_id);
create index task_assignees_member_id_idx on task_assignees (member_id);

create table subtasks (
  id           text primary key,
  task_id      text not null references tasks(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title        text not null,
  done         boolean not null default false,
  assignee_id  uuid references workspace_members(id) on delete set null,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);
create index subtasks_workspace_id_idx on subtasks (workspace_id);
create index subtasks_task_id_idx on subtasks (task_id);

-- File attachments on tasks. `storage_path` points into the `task-attachments`
-- Storage bucket (see the Storage section near the bottom of this file), under the
-- convention {workspace_id}/{task_id}/{timestamp}-{file_name} so a single RLS
-- policy on storage.objects can key off the first path segment. Deleting a task
-- cascades this table, but NOT the underlying Storage object — the app deletes the
-- Storage object explicitly before removing the row (see deleteTaskAttachment in
-- lib/workspace.ts); a task deleted by any other path (e.g. direct SQL) would leave
-- an orphaned file. Acceptable for now; a scheduled cleanup job would close that gap.
create table task_attachments (
  id           uuid primary key default gen_random_uuid(),
  task_id      text not null references tasks(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  file_size    bigint not null,
  content_type text not null default 'application/octet-stream',
  uploaded_by  uuid references auth.users(id),
  created_at   timestamptz not null default now()
);
create index task_attachments_workspace_id_idx on task_attachments (workspace_id);
create index task_attachments_task_id_idx on task_attachments (task_id);

-- ---------------------------------------------------------------------------
-- RLS helper functions (SECURITY DEFINER to avoid self-referential recursion
-- on workspace_members' own RLS policies)
-- ---------------------------------------------------------------------------

create or replace function is_workspace_member(target_workspace uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = target_workspace
      and user_id = (select auth.uid())
      and status = 'active'
  );
$$;

create or replace function is_workspace_owner(target_workspace uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = target_workspace
      and user_id = (select auth.uid())
      and status = 'active'
      and role = 'owner'
  );
$$;

revoke all on function is_workspace_member(uuid) from public;
revoke all on function is_workspace_owner(uuid) from public;
grant execute on function is_workspace_member(uuid) to authenticated;
grant execute on function is_workspace_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------

alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table board_columns enable row level security;
alter table projects enable row level security;
alter table project_features enable row level security;
alter table project_requirements enable row level security;
alter table project_resources enable row level security;
alter table workspace_resources enable row level security;
alter table activity_log enable row level security;
alter table tasks enable row level security;
alter table task_assignees enable row level security;
alter table subtasks enable row level security;
alter table task_attachments enable row level security;

create policy "select own workspace" on workspaces
  for select using (is_workspace_member(id));
create policy "insert via signup only" on workspaces
  for insert with check (owner_id = (select auth.uid()));
create policy "owner updates workspace" on workspaces
  for update using (is_workspace_owner(id));

create policy "members view roster" on workspace_members
  for select using (is_workspace_member(workspace_id));
create policy "owner invites member" on workspace_members
  for insert with check (is_workspace_owner(workspace_id));
create policy "owner updates member" on workspace_members
  for update using (is_workspace_owner(workspace_id));
create policy "owner removes member" on workspace_members
  for delete using (is_workspace_owner(workspace_id) and role <> 'owner');

create policy "rw within workspace" on board_columns
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "rw within workspace" on projects
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "rw within workspace" on project_features
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "rw within workspace" on project_requirements
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "rw within workspace" on project_resources
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "rw within workspace" on workspace_resources
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

-- Append-only: members can read and write new entries, but no update/delete policy
-- exists, so the feed can't be edited or erased from the client once written.
create policy "members view activity" on activity_log
  for select using (is_workspace_member(workspace_id));
create policy "members write activity" on activity_log
  for insert with check (is_workspace_member(workspace_id) and actor_id = (select auth.uid()));

create policy "rw within workspace" on tasks
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "rw within workspace" on task_assignees
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "rw within workspace" on subtasks
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));
create policy "rw within workspace" on task_attachments
  for all using (is_workspace_member(workspace_id)) with check (is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- Auth / invite RPCs
-- ---------------------------------------------------------------------------

create or replace function bootstrap_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into workspaces (name, owner_id)
  values (workspace_name, uid)
  returning id into new_workspace_id;

  insert into workspace_members (workspace_id, user_id, email, display_name, role, status, joined_at)
  select new_workspace_id, uid, u.email,
         coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1)),
         'owner', 'active', now()
  from auth.users u
  where u.id = uid;

  insert into board_columns (id, workspace_id, name, counts_as_complete, position)
  select gen_random_uuid()::text, new_workspace_id, c.name, c.counts_as_complete, c.position
  from (values
    ('Initiate', false, 0),
    ('Briefing', false, 1),
    ('In Production', false, 2),
    ('Review', false, 3),
    ('Done', true, 4),
    ('Live', true, 5)
  ) as c(name, counts_as_complete, position);

  return new_workspace_id;
end;
$$;
grant execute on function bootstrap_workspace(text) to authenticated;

create or replace function create_invite(invitee_email citext, invitee_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
  tok uuid;
begin
  select workspace_id into ws_id
  from workspace_members
  where user_id = (select auth.uid()) and role = 'owner' and status = 'active'
  limit 1;

  if ws_id is null then
    raise exception 'not a workspace owner';
  end if;

  insert into workspace_members (workspace_id, email, display_name, role, status, invited_by)
  values (ws_id, invitee_email, invitee_name, 'member', 'invited', (select auth.uid()))
  on conflict (workspace_id, email)
  do update set invite_token = gen_random_uuid(), status = 'invited'
  returning invite_token into tok;

  return tok;
end;
$$;
grant execute on function create_invite(citext, text) to authenticated;

create or replace function get_invite_by_token(token uuid)
returns table (workspace_name text, email text, status text)
language sql
security definer
set search_path = public
as $$
  select w.name, wm.email, wm.status
  from workspace_members wm
  join workspaces w on w.id = wm.workspace_id
  where wm.invite_token = token;
$$;
grant execute on function get_invite_by_token(uuid) to anon, authenticated;

create or replace function accept_invite(token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws_id uuid;
  uid uuid := (select auth.uid());
  invite_workspace_id uuid;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select workspace_id into invite_workspace_id
  from workspace_members
  where invite_token = token and status = 'invited';

  if invite_workspace_id is null then
    raise exception 'invalid or already-used invite';
  end if;

  -- Multi-workspace membership isn't supported yet (no switcher UI, and
  -- getCurrentWorkspace() assumes exactly one active membership per user).
  -- Block it here rather than silently creating a broken account state.
  if exists (
    select 1 from workspace_members
    where user_id = uid and status = 'active' and workspace_id <> invite_workspace_id
  ) then
    raise exception 'you already belong to another workspace';
  end if;

  update workspace_members
  set user_id = uid, status = 'active', joined_at = now()
  where invite_token = token and status = 'invited'
  returning workspace_id into ws_id;

  if ws_id is null then
    raise exception 'invalid or already-used invite';
  end if;

  return ws_id;
end;
$$;
grant execute on function accept_invite(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table
  tasks, subtasks, task_assignees, board_columns,
  projects, project_features, project_requirements, project_resources,
  workspace_resources, activity_log, task_attachments;

-- ---------------------------------------------------------------------------
-- Storage: task attachments
-- ---------------------------------------------------------------------------

-- Private bucket — every file is served via a short-lived signed URL
-- (see getAttachmentDownloadUrl in lib/workspace.ts), never a public URL.
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', false)
on conflict (id) do nothing;

-- Objects are stored as {workspace_id}/{task_id}/{timestamp}-{file_name};
-- storage.foldername(name) splits that path, so element 1 is the workspace_id.
-- RLS on storage.objects is enabled by default on every Supabase project, so
-- these policies alone are enough to scope access to workspace members.
create policy "workspace members read attachments"
  on storage.objects for select
  using (
    bucket_id = 'task-attachments'
    and is_workspace_member((storage.foldername(name))[1]::uuid)
  );

create policy "workspace members upload attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'task-attachments'
    and is_workspace_member((storage.foldername(name))[1]::uuid)
  );

create policy "workspace members delete attachments"
  on storage.objects for delete
  using (
    bucket_id = 'task-attachments'
    and is_workspace_member((storage.foldername(name))[1]::uuid)
  );
