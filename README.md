# SprintFlow

A sprint-planning app where one dataset drives four synchronized views: Kanban, Gantt, Calendar and List.
Change a task in one view and every other view updates.

**Demo:** _add your Loom or MP4 link here_

Built with Next.js 16, React, TypeScript (strict), Tailwind CSS v4, shadcn/ui, Redux Toolkit,
@dnd-kit, date-fns, Recharts and react-markdown. No backend or auth is required.

## Quick start

```bash
npm install
cp .env.example .env.local      # Windows: copy .env.example .env.local
npm run dev                     # http://localhost:3000
```

Requires Node 20+.

## Scripts

| Command                       | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                 | Development server                                                       |
| `npm run typecheck`           | TypeScript check                                                         |
| `npm run lint`                | ESLint                                                                   |
| `npm run build` / `npm start` | Production build and server                                              |
| `npm run demo`                | Record an MP4 walkthrough with Cypress (needs `build` + `start` running) |

## Data modes

Set `NEXT_PUBLIC_DATA_SOURCE` in `.env.local`, then restart the dev server:

- `local` (default): data lives in the browser's localStorage.
- `http`: data is saved through `/api/*` into `.data/db.json`.

The UI only talks to a small `DataSource` interface (`src/lib/data-source`). To use a real database,
rewrite the two route handlers in `src/app/api`. The first run seeds sample data.

## Architecture

- **One store.** Every view reads and writes the same Redux `data` slice.
- **Status comes from the column.** A task stores `columnId`; each column maps to a status category.
- **URL as state.** View, sprint, filters, calendar mode and date live in the query string.
- **Filters in one place.** `useProjectTasks` applies the shared filters, and all four views use it.
- **Sync and history middleware.** Changed rows are saved optimistically with retry. Undo/redo uses snapshots.

## Features

- **Kanban:** drag whole cards between and within columns, add/rename/delete columns, WIP limits, context menu.
- **Task drawer:** Markdown description, checklist, comments, activity, dependencies, mock attachments.
- **Gantt:** draggable and resizable bars, dependency arrows, conflict highlighting, day/week/month zoom.
- **Calendar:** month, week and day views, drag to reschedule, create by date.
- **List:** sortable, paginated, inline editing, bulk actions.
- **Shared:** URL-synced filters, undo/redo, keyboard shortcuts, dark mode, dashboard, reports (CSV), notifications.

## Keyboard shortcuts

`C` new task · `F` or `/` search · `Ctrl/Cmd+Z` undo · `Ctrl/Cmd+Shift+Z` redo · `Esc` close · `?` help

## Known limitations

- No authentication. The current user is the workspace lead.
- No multi-user conflict handling (last write wins).
- Attachments store file names and sizes only.
- Undo history is in memory and resets on refresh.
- The JSON-file API does not work on serverless hosts.
- List: no column resizing. Inline editing covers title, status, priority, assignee, dates and hours.
- Gantt: no edge auto-scroll while dragging, and dependencies are finish-to-start only.
- Kanban columns can't be reordered by dragging.
- One workspace only.
