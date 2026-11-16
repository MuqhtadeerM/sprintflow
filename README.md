# SprintFlow

A project management app with four synchronized views (Kanban, Gantt, Calendar, List) over one shared dataset.
Built with Next.js 16, React, TypeScript (strict), Tailwind CSS v4, shadcn/ui (Base UI), Redux Toolkit,
@dnd-kit, date-fns, Recharts and react-markdown.

## Quick start

```bash
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm run dev                     # http://localhost:3000
```

Requires Node 20+.

## Scripts

| Command                       | Purpose                     |
| ----------------------------- | --------------------------- |
| `npm run dev`                 | Development server          |
| `npm run typecheck`           | TypeScript check (no emit)  |
| `npm run lint`                | ESLint                      |
| `npm run build` / `npm start` | Production build and server |

## Data modes

Set `NEXT_PUBLIC_DATA_SOURCE` in `.env.local`, then restart the dev server:

- `local` (default): data lives in your browser's localStorage.
- `http`: data is saved through `/api/*` into `.data/db.json`. Open the app in another browser and the same data appears.

The app only talks to a small `DataSource` interface (`src/lib/data-source`). To use a real database, rewrite the
two route handlers in `src/app/api` (and `src/server/db.ts`). The UI does not change.
The first run seeds sample data (2 projects, 4 sprints, 19 tasks, 5 users).

## Architecture

- **One store.** `data` slice holds everything. Every view reads it and dispatches to it, so views cannot disagree.
- **URL as state.** View, sprint, filters, calendar mode and date live in the query string: shareable and refresh-safe.
- **Status comes from the column.** A task stores `columnId`. Each column maps to a status category.
- **Sync middleware.** Diffs state after each action and saves only the changed rows (optimistic, with retry).
- **History middleware.** Snapshot-based undo/redo. Same-tick actions merge into one step.

```
src/
  app/            routes (dashboard, projects, reports, settings, api)
  components/     layout, sidebar, header, kanban, gantt, calendar, task-list, task-drawer, filters, dashboard, shared, ui
  store/          slices, sync + history middleware, bootstrap
  hooks/          filters, project context, calendar nav, shortcuts, task actions
  lib/            pure logic (filters, dates, gantt, kanban, calendar, reports, backup, data-source)
  types/          domain models
  data/           seed data
```

## Features

Kanban (drag the whole card, WIP limits, column management, context menu), Gantt (drag, resize, dependency arrows,
conflict detection, zoom), Calendar (month/week/day, drag to reschedule), List (sort, inline edit, bulk actions),
task drawer (Markdown, checklist, comments, activity, dependencies, attachments), shared URL filters, undo/redo,
keyboard shortcuts, dashboard, reports with CSV export, notifications, backup import/export, dark mode, responsive layout.

## Keyboard shortcuts

`C` new task · `F` or `/` search · `Ctrl/Cmd+Z` undo · `Ctrl/Cmd+Shift+Z` redo · `Esc` close · `?` help

## Known limitations

See the checklist in the project notes: no authentication, no multi-user conflict handling, attachments store
metadata only, the JSON-file API does not work on serverless hosts, history resets on refresh.
