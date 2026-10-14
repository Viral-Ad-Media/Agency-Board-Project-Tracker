# Agency Board Task Tracker

Agency Board Task Tracker is a multi-tenant Next.js SaaS app for managing agency work. Each sign-up creates its own workspace with real accounts, email invites, and Postgres-backed data isolated per workspace via Supabase Row Level Security. Inside a workspace, teams get a kanban task board, Projects (timeline, requirements, features, and costed resources), and a Subscriptions tracker for every tool and app the agency pays for — all synced live across everyone in the workspace.

## Features

### Accounts & workspaces

- Email/password sign-up, log-in, and sign-out, backed by Supabase Auth.
- Each sign-up bootstraps a new workspace with a default set of board columns (Initiate, Briefing, In Production, Review, Done, Live) and makes the signer-upper the workspace owner.
- Owners invite teammates by email from the "Team" modal; invites generate a shareable `/invite/[token]` link. An invited member gets a real login, tied to that one workspace.
- Every table is scoped by `workspace_id` with Postgres Row Level Security, so one workspace can never see another's data.
- Realtime sync: task, column, project, and subscription changes made by any teammate appear live for everyone else in the workspace.

### Task board

- Kanban board with editable workflow columns. Column management (rename, reorder, add, delete, and "counts as complete" flagging) from the "Columns" button in the header. A column can't be deleted while it still has cards.
- Task cards with client, multiple assignees, priority, deadline, and overdue/due-soon status.
- Drag and drop cards between columns, or use the "Move to" selector in the task detail view. Moving a card forward automatically marks earlier stages complete.
- A per-task subtask checklist with add/toggle/assign/delete, separate from the stage pipeline.
- Optionally assign a task to a Project (see below) from the task form or its detail view; assigned tasks show a project chip on their card.
- Search and filter bar (text search over name/client/description, plus assignee, priority, and project filters).
- Summary stats for total, overdue, due-soon, and completed tasks.
- Undo toast after deleting a task (6-second window).
- Export the board to a JSON file and re-import it later (with a confirmation step before it replaces the board).

### Projects

- A Project groups tasks under a name, client, status (planning/active/on hold/completed), start date, and target date.
- Each project has its own features checklist, requirements checklist, and a costed resource list (name, cost, notes) with a running total.
- "View Board" from a project filters the task board down to that project's tasks.
- Deleting a project asks for confirmation first; its tasks are kept and simply unassigned from the project (not deleted).

### Subscriptions

- Workspace-wide tracker for every tool, app, and service the agency pays for — distinct from a project's one-off resource costs.
- Each entry has a category, cost, billing cycle (monthly/yearly/weekly/one-time), status (active/trial/cancelled), renewal date, an owner (team member), a link, and notes.
- A summary row shows estimated monthly spend, estimated annual spend, active tool count, and how many renewals are due in the next 14 days.
- Deleting a subscription asks for confirmation first.

### Onboarding & polish

- One-time welcome modal on first visit, offering a guided product tour or the option to skip straight to the board.
- A replayable product tour (from the "Help" button) spotlighting the Board/Projects/Subscriptions tabs, the summary bar, task creation, search/filters, the board itself, and team/column management.
- An empty-board guide shown whenever the board has zero tasks, distinct from the per-column "No matches" message shown while a filter excludes everything.
- Hover/focus tooltips on icon-only buttons, including dynamic tooltips explaining why a delete action is disabled.
- Responsive styling for desktop and smaller screens.

## Tech Stack

- Next.js `16.2.6` (App Router)
- React `19.2.6`
- TypeScript
- Supabase: Postgres, Auth, Row Level Security, Realtime (`@supabase/supabase-js`, `@supabase/ssr`)
- CSS Modules are not used; global styling lives in `app/globals.css`
- `next/font` for Syne and DM Sans
- `lucide-react` for icons
- ESLint with `eslint-config-next`

## Requirements

Next.js in this project requires Node.js `>=20.9.0`.

You'll also need a Supabase project (free tier is enough for development).

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project, then copy `.env.example` to `.env.local` and fill in your project's URL and anon key:

   ```bash
   cp .env.example .env.local
   ```

   ```text
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

   Without these, the app renders a "Supabase isn't configured yet" placeholder instead of crashing — nothing else will work until they're set.

3. Apply the schema in `supabase/migrations/0001_init.sql` to your project (via the Supabase SQL editor, the Supabase CLI, or the Supabase MCP `apply_migration` tool).

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`, sign up, and you'll land on a fresh empty workspace.

## Scripts

```bash
npm run dev     # local development server
npm run build   # production build + TypeScript check
npm run start   # production server (after a build)
npm run lint    # ESLint
```

## Project Structure

```text
.
├── app/
│   ├── auth/callback/route.ts   # OAuth/email-confirmation code exchange
│   ├── invite/[token]/          # Public invite-accept page + its client panel
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── globals.css              # Design tokens and global UI styles
│   ├── layout.tsx               # Root layout, metadata, and font setup
│   └── page.tsx                 # Server Component: resolves the workspace, fetches board data
├── components/
│   ├── Board.tsx                 # Client orchestrator: all board/project/subscription state & handlers
│   ├── AppHeader, SummaryBar, FilterBar, TaskBoard, BoardColumn, TaskCard, PipelineTrack
│   ├── TaskFormModal, TaskDetailModal, SubtaskChecklist, ColumnSettingsModal, TeamSettingsModal
│   ├── ProjectsView, ProjectFormModal, ProjectDetailModal, ProjectChecklist
│   ├── SubscriptionsView, ResourceFormModal
│   ├── ConfirmDeleteModal, ConfirmActionModal, ImportConfirmModal, Modal, DetailItem, Tooltip
│   ├── WelcomeModal, ProductTour, EmptyBoardState, UndoToast
├── lib/
│   ├── tasks.ts        # Storage-agnostic domain types, constants, and pure utility functions
│   ├── workspace.ts     # The data-access layer: every Supabase query/mutation lives here
│   ├── onboarding.ts     # Tour step content and the onboarding-seen storage key
│   └── supabase/
│       ├── client.ts      # Browser Supabase client
│       └── server.ts      # Server Component / Route Handler Supabase client
├── supabase/
│   └── migrations/0001_init.sql   # Full schema, RLS policies, and auth/invite RPCs
├── proxy.ts              # Next.js 16 middleware: session refresh + auth-gate redirects
├── eslint.config.mjs
├── next.config.mjs
├── package.json
└── tsconfig.json
```

## App Architecture

- `app/page.tsx` is an async Server Component. It resolves the caller's workspace via `getCurrentWorkspace()`, fetches all board/project/subscription data in `getBoardData()`, and passes it to `<Board>` as initial props.
- `components/Board.tsx` is a client component that owns all interactive state (drag-and-drop, modals, forms, filters) and issues optimistic updates: it updates local state immediately, then persists the change through `lib/workspace.ts`, reverting and showing an error if the write fails.
- A single Realtime channel per workspace listens for `postgres_changes` on every relevant table and triggers a debounced full refetch, so changes made by teammates show up live.
- `proxy.ts` (Next.js 16's replacement for `middleware.ts`) refreshes the Supabase session on every request and redirects unauthenticated users to `/login` (except for `/login`, `/signup`, `/invite/*`, and `/auth/callback`). It no-ops if Supabase env vars aren't set, so the app doesn't crash before they're configured.
- `lib/tasks.ts` stays storage-agnostic: it only knows about plain TypeScript shapes (`Task`, `Project`, `WorkspaceResource`, etc.) and pure functions over them, so the ~20 presentational components never talk to Supabase directly.
- `lib/workspace.ts` is the only file that talks to Supabase for board/project/subscription data — it hand-maps Postgres rows to the app-level types from `lib/tasks.ts`.

## Data Model

The full schema lives in `supabase/migrations/0001_init.sql`. At a high level:

- `workspaces`, `workspace_members` — one workspace per sign-up; members have a `role` (owner/member) and `status` (invited/active).
- `board_columns`, `tasks`, `task_assignees`, `subtasks` — the kanban board. `tasks.project_id` optionally links a task to a project.
- `projects`, `project_features`, `project_requirements`, `project_resources` — Projects and their checklists/costed resources.
- `workspace_resources` — the Subscriptions tracker.

Every table carries a denormalized `workspace_id` so Row Level Security policies are flat, joinless, single-table checks (`is_workspace_member(workspace_id)`), backed by two `SECURITY DEFINER` helper functions that avoid recursive RLS lookups on `workspace_members`. Board/task/project/subscription IDs are client-generated `text` ids (see `generateId()` in `lib/tasks.ts`) so optimistic UI updates don't have to wait on a round trip; workspace and membership rows use server-generated `uuid`s.

## Auth & Invites

- Sign-up calls `supabase.auth.signUp()`, then the `bootstrap_workspace` RPC to create the workspace, the owner's membership row, and default columns.
- Invites go through `create_invite` (owner-only) and `get_invite_by_token` (publicly readable by token) RPCs; accepting one calls `accept_invite`, which links the invited row to the now-authenticated user.
- A user can only belong to one workspace at a time — `accept_invite` rejects a second invite if the caller already has an active membership elsewhere, since there's no multi-workspace switcher UI yet (the schema supports it).

## Deployment

This is a standard Next.js app and can be deployed to any platform that supports it, such as Vercel or Netlify. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables on your host, and make sure the migration has been applied to the Supabase project you point it at.

```bash
npm run build
npm run start
```
