# Agency Board Project Tracker

Agency Board Project Tracker is a Next.js app for managing agency projects on a kanban-style board. It lets a team create project cards, move them through workflow columns, track stage completion, flag overdue work, and persist board state locally in the browser.

This project was migrated from a single standalone HTML file into a typed Next.js App Router application.
The original HTML file has since been removed after the UI was split into reusable React components.

## Features

- Kanban board with editable workflow columns (defaults to Initiate, Briefing, In Production, Review, Done, Live).
- Column management: rename, reorder, add, or delete columns from the "Columns" button in the header. A column can't be deleted while it still has cards, and each column can be flagged "counts as complete" (drives overdue/due-soon logic and the Completed stat).
- Project cards with client, multiple assignees, priority, deadline, and overdue status.
- "Due soon" warnings on cards whose deadline is within the next 3 days.
- Drag and drop cards between workflow columns, or use the "Move to" selector in the project detail view.
- Moving a card forward automatically marks the earlier stages complete.
- Project stage tracker with clickable completion bubbles, driven by the current set of board columns.
- A per-project task checklist (subtasks) with add/toggle/assign/delete, separate from the stage pipeline.
- Search and filter bar (text search over name/client/description, plus assignee and priority filters).
- Summary stats for total, overdue, due-soon, and completed projects.
- Add, edit, view, and delete project cards through modal dialogs.
- Undo toast after deleting a project (6-second window).
- Export the board to a JSON file and re-import it later (with a confirmation step before it replaces the board).
- Browser localStorage persistence under the `agencyBoard_v2` (projects) and `agencyBoard_columns_v1` (columns) keys, with automatic migration from the older single-assignee/fixed-column data shape.
- Board state stays in sync across tabs open to the same browser.
- Seed project on first launch so the board is not empty.
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
│   └── page.tsx          # Main board UI and project state logic
├── components/
│   ├── AppHeader.tsx
│   ├── BoardColumn.tsx
│   ├── ConfirmDeleteModal.tsx
│   ├── DetailItem.tsx
│   ├── Modal.tsx
│   ├── PipelineTrack.tsx
│   ├── ProjectBoard.tsx
│   ├── ProjectCard.tsx
│   ├── ProjectDetailModal.tsx
│   ├── ProjectFormModal.tsx
│   └── SummaryBar.tsx
├── lib/
│   └── projects.ts       # Shared project types, constants, and utilities
├── eslint.config.mjs     # ESLint flat config
├── next.config.mjs       # Next.js configuration
├── package.json          # Scripts, dependencies, and overrides
├── package-lock.json     # Locked dependency tree
└── tsconfig.json         # TypeScript configuration
```

## App Architecture

The board is implemented as a client component in `app/page.tsx` because it depends on browser-only APIs and interactive state:

- `localStorage` for persistence
- drag and drop events
- modal open and close state
- form state and validation feedback
- project stage toggles

The page keeps the project list in React state and writes changes back to localStorage. The UI is rendered declaratively from that state, including card counts, summary stats, modals, pipelines, and overdue indicators.

## Reusable Components

The UI is split into focused components under `components/`:

- `AppHeader` renders the top navigation/brand area.
- `SummaryBar` renders project totals and the add-project action.
- `ProjectBoard` lays out the kanban board.
- `BoardColumn` renders one workflow column and its drop zone.
- `ProjectCard` renders a draggable project card.
- `PipelineTrack` renders the reusable stage completion bubbles for cards and detail views.
- `Modal` provides the shared modal overlay/backdrop behavior.
- `ProjectFormModal` handles add/edit project form UI.
- `ProjectDetailModal` handles read-only project details and project actions.
- `ConfirmDeleteModal` handles delete confirmation.
- `DetailItem` renders labeled detail rows inside modals.

Shared project constants, TypeScript types, localStorage normalization, date formatting, overdue checks, and seed data live in `lib/projects.ts`.

## Data Model

Each project is stored as an object similar to:

```ts
type Project = {
  id: string;
  name: string;
  client: string;
  desc: string;
  column: "Initiate" | "Briefing" | "In Production" | "Review" | "Done" | "Live";
  assignee: string;
  priority: "High" | "Medium" | "Low";
  deadline: string;
  stages: boolean[];
  createdAt: number;
};
```

The `stages` array matches the board column order. For example, index `0` maps to `Initiate`, index `1` maps to `Briefing`, and so on.

## Persistence

Projects are stored in browser localStorage:

```text
agencyBoard_v2
```

The app normalizes loaded projects before rendering them. This protects the UI from malformed or older localStorage data by filling missing fields with safe defaults where possible.

To reset the board during development, clear the `agencyBoard_v2` key from your browser storage and reload the page. The seed project will be recreated automatically.

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

- The original form had both a submit handler and a submit button click handler, which could create or save a project twice. The Next.js version uses one `onSubmit` path.
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

The board reads from localStorage. Clear the `agencyBoard_v2` key in your browser devtools, then reload.

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

Because project data currently lives in each user's browser localStorage, deployments do not share board data across users or devices. To make the board collaborative, add a backend database and replace the localStorage persistence layer.
