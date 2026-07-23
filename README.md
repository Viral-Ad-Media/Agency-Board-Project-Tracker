# Agency Board Task Tracker

Agency Board Task Tracker is a Next.js app for managing agency work on a kanban-style board. It lets a team create task cards, move them through editable workflow columns, track stage completion, break work down into subtasks, flag overdue work, and persist board state locally in the browser.

This project was migrated from a single standalone HTML file into a typed Next.js App Router application.
The original HTML file has since been removed after the UI was split into reusable React components.

## Features

- Kanban board with editable workflow columns (defaults to Initiate, Briefing, In Production, Review, Done, Live).
- Column management: rename, reorder, add, or delete columns from the "Columns" button in the header. A column can't be deleted while it still has cards, and each column can be flagged "counts as complete" (drives overdue/due-soon logic and the Completed stat).
- Team management: add or remove team members from the "Team" button in the header. A member can't be removed while still assigned to a task or subtask, and the team always keeps at least one member.
- Task cards with client, multiple assignees, priority, deadline, and overdue status.
- "Due soon" warnings on cards whose deadline is within the next 3 days.
- Drag and drop cards between workflow columns, or use the "Move to" selector in the task detail view.
- Moving a card forward automatically marks the earlier stages complete.
- Task stage tracker with clickable completion bubbles, driven by the current set of board columns.
- A per-task subtask checklist with add/toggle/assign/delete, separate from the stage pipeline.
- Search and filter bar (text search over name/client/description, plus assignee and priority filters).
- Summary stats for total, overdue, due-soon, and completed tasks.
- Add, edit, view, and delete task cards through modal dialogs.
- Undo toast after deleting a task (6-second window).
- Export the board to a JSON file and re-import it later (with a confirmation step before it replaces the board).
- Browser localStorage persistence under the `agencyBoard_v2` (tasks), `agencyBoard_columns_v1` (columns), and `agencyBoard_team_v1` (team members) keys, with automatic migration from older data shapes (single assignee, fixed columns, name-based assignee references).
- Board state stays in sync across tabs open to the same browser.
- Seed task on first launch so the board is not empty.
- Responsive styling for desktop and smaller screens.

## Tech Stack

- Next.js `16.2.6`
- React `19.2.6`
- TypeScript
- App Router
- CSS Modules are not used; global styling lives in `app/globals.css`
- `next/font` for Syne and DM Sans
- `lucide-react` for icons
- ESLint with `eslint-config-next`

## Requirements

Next.js in this project requires Node.js `>=20.9.0`.

Recommended:

```bash
node --version
npm --version
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

If port `3000` is already in use, run Next on another port:

```bash
npm run dev -- --port 3001
```

## Scripts

```bash
npm run dev
```

Starts the local Next.js development server.

```bash
npm run build
```

Creates an optimized production build and runs TypeScript validation.

```bash
npm run start
```

Starts the production server after a successful build.

```bash
npm run lint
```

Runs ESLint across the project.

## Project Structure

```text
.
├── app/
│   ├── globals.css       # Design tokens and global UI styles
│   ├── layout.tsx        # Root layout, metadata, and font setup
│   └── page.tsx          # Main board UI and task state logic
├── components/
│   ├── AppHeader.tsx
│   ├── BoardColumn.tsx
│   ├── ColumnSettingsModal.tsx
│   ├── ConfirmDeleteModal.tsx
│   ├── DetailItem.tsx
│   ├── FilterBar.tsx
│   ├── ImportConfirmModal.tsx
│   ├── Modal.tsx
│   ├── PipelineTrack.tsx
│   ├── SubtaskChecklist.tsx
│   ├── SummaryBar.tsx
│   ├── TaskBoard.tsx
│   ├── TaskCard.tsx
│   ├── TaskDetailModal.tsx
│   ├── TaskFormModal.tsx
│   ├── TeamSettingsModal.tsx
│   └── UndoToast.tsx
├── lib/
│   └── tasks.ts          # Shared task/column/team types, constants, and utilities
├── eslint.config.mjs     # ESLint flat config
├── next.config.mjs       # Next.js configuration
├── package.json          # Scripts, dependencies, and overrides
├── package-lock.json     # Locked dependency tree
└── tsconfig.json         # TypeScript configuration
```

## App Architecture

The board is implemented as a client component in `app/page.tsx` because it depends on browser-only APIs and interactive state:

- `localStorage` for persistence (tasks, columns, and team members)
- drag and drop events
- modal open and close state
- form state and validation feedback
- task stage toggles

The page keeps the task list, column list, and team member list in React state and writes changes back to localStorage. The UI is rendered declaratively from that state, including card counts, summary stats, modals, pipelines, and overdue indicators.

## Reusable Components

The UI is split into focused components under `components/`:

- `AppHeader` renders the top navigation/brand area, plus Team, Columns, Export, and Import actions.
- `SummaryBar` renders task totals and the add-task action.
- `FilterBar` renders the search box and assignee/priority filters.
- `TaskBoard` lays out the kanban board.
- `BoardColumn` renders one workflow column and its drop zone.
- `TaskCard` renders a draggable task card.
- `PipelineTrack` renders the reusable stage completion bubbles for cards and detail views.
- `SubtaskChecklist` renders the per-task subtask list inside the detail modal.
- `Modal` provides the shared modal overlay/backdrop behavior.
- `TaskFormModal` handles add/edit task form UI.
- `TaskDetailModal` handles read-only task details and task actions.
- `ConfirmDeleteModal` handles delete confirmation.
- `ImportConfirmModal` handles the confirm-before-replace step for imports.
- `ColumnSettingsModal` handles rename/reorder/add/delete for board columns.
- `TeamSettingsModal` handles add/remove for team members.
- `UndoToast` shows the post-delete undo affordance.
- `DetailItem` renders labeled detail rows inside modals.

Shared task/column/team constants, TypeScript types, localStorage normalization, date formatting, overdue checks, and seed data live in `lib/tasks.ts`.

## Data Model

Each task is stored as an object similar to:

```ts
type Task = {
  id: string;
  name: string;
  client: string;
  desc: string;
  column: string; // references a board column's id
  assignees: string[]; // team member ids
  priority: "High" | "Medium" | "Low";
  deadline: string;
  stages: Record<string, boolean>; // keyed by column id
  subtasks: Subtask[];
  createdAt: number;
};

type Subtask = {
  id: string;
  title: string;
  done: boolean;
  assignee: "" | string; // team member id
};
```

Board columns and team members are stored separately as editable lists (`BoardColumnDef[]` and `TeamMemberDef[]`), so `column` and `assignees` reference ids from those lists rather than fixed literal values.

## Persistence

Board state is stored in browser localStorage under three keys:

```text
agencyBoard_v2            # tasks
agencyBoard_columns_v1    # board columns
agencyBoard_team_v1       # team members
```

The app normalizes loaded data before rendering it. This protects the UI from malformed or older localStorage data by filling missing fields with safe defaults, and migrates older data shapes (a single `assignee` string instead of an `assignees` array, positional `stages` arrays instead of a column-keyed record, name-based assignee references instead of ids).

To reset the board during development, clear all three keys from your browser storage and reload the page. The seed task will be recreated automatically.

## Migration Notes

The original app was a single HTML file containing markup, CSS, and JavaScript. The Next.js migration keeps the same product behavior while changing the implementation shape:

- HTML structure became React components.
- DOM event listeners became React event handlers.
- Manual DOM rendering became state-driven rendering.
- Inline SVG icons were replaced with `lucide-react` where practical.
- Google Fonts are loaded through `next/font` instead of `<link>` tags.
- Styling moved into `app/globals.css`.
- The original HTML file was removed after the Next.js component structure was created.

## Fixes Made During Migration

The migration also fixed a couple of interaction issues found during review:

- The original form had both a submit handler and a submit button click handler, which could create or save a task twice. The Next.js version uses one `onSubmit` path.
- The original detail modal pipeline rebuilt DOM nodes and reattached click listeners in a way that could toggle a stage twice. The Next.js version uses one reusable `PipelineTrack` component.
- Dragging visual state is now controlled by React state instead of direct DOM class mutation.

## Styling

The visual system is defined with CSS custom properties in `app/globals.css`:

- background and surface colors
- border colors
- priority colors
- typography variables
- border radius values
- motion durations

The board intentionally keeps a compact operational-tool layout: dense columns, scannable cards, restrained contrast, and no marketing-style landing page.

## Dependency Notes

`package.json` includes a `postcss` override:

```json
"overrides": {
  "postcss": "8.5.14"
}
```

This keeps `npm audit` clean while staying on the installed Next.js release. Without the override, npm reports a moderate advisory through Next's pinned PostCSS dependency and suggests an unsuitable downgrade path.

## Troubleshooting

### npm cache permission error

If `npm install` fails with an `EACCES` error related to `~/.npm`, the global npm cache may contain files owned by another user. You can avoid that cache for this project:

```bash
npm install --cache ./.npm-cache
```

The local `.npm-cache/` directory is ignored by Git.

### Port already in use

Use another port:

```bash
npm run dev -- --port 3001
```

### Board data looks stale

The board reads from localStorage. Clear the `agencyBoard_v2`, `agencyBoard_columns_v1`, and `agencyBoard_team_v1` keys in your browser devtools, then reload.

## Verification

The migrated app has been checked with:

```bash
npm run lint
npm run build
npm audit --omit=dev
```

Expected results:

- lint passes
- production build completes
- production dependency audit reports `0 vulnerabilities`

## Deployment

This is a standard Next.js app and can be deployed to any platform that supports Next.js, such as Vercel, Netlify, or a Node.js server.

For a production build:

```bash
npm run build
npm run start
```

Because task data currently lives in each user's browser localStorage, deployments do not share board data across users or devices. To make the board collaborative, add a backend database and replace the localStorage persistence layer.
