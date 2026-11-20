# 🚀 SprintFlow – Project Management Application

SprintFlow is a modern, responsive project management application designed to help teams plan, organize, and track their work efficiently. It provides multiple ways to manage tasks, including Kanban boards, Gantt timelines, Calendar views, and sortable task lists.

The application uses a centralized state management system, ensuring that changes made in one view are automatically reflected across all other views.

## 🎬 Project Demo

**Watch the application demo:** [SprintFlow – Demo Video](https://1drv.ms/v/c/b1eb5d9b2a2d82e5/IQCTGC7dX4Y7R5GjPSlAUB17AVheKtQDKOA7IS-5ZBbmmHw?e=2w2Sup)

## ✨ Key Features

### 📊 Dashboard
- Overview of total, completed, in-progress, and overdue tasks.
- Sprint progress tracking.
- Task distribution and team workload analytics.
- Upcoming deadlines and recent activity.

### 📋 Kanban Board
- Drag and drop tasks between columns.
- Reorder tasks within columns.
- Create, rename, and delete columns.
- Configure Work-in-Progress (WIP) limits.
- View task priorities, labels, assignees, and due dates.

### 📅 Calendar View
- Monthly, weekly, and daily calendar layouts.
- View tasks according to their due dates.
- Drag and drop tasks to update dates.
- Create tasks directly from calendar dates.
- Navigate between dates and return to today.

### 📈 Gantt Timeline
- Visualize project schedules and task durations.
- Drag and resize task bars to update dates.
- Manage task dependencies.
- Track task progress.
- Switch between day, week, and month zoom levels.

### 📝 Task Management
- Create, edit, delete, and duplicate tasks.
- Assign priorities, labels, and team members.
- Manage start dates, due dates, and estimated hours.
- Add Markdown descriptions.
- Manage checklists, comments, and activity history.
- Track task progress and dependencies.

### 📑 Sortable List View
- View tasks in a structured table.
- Sort and search tasks.
- Inline task editing.
- Manage column visibility.
- Select multiple tasks for bulk actions.

### ⚙️ Additional Features
- Centralized Zustand state management.
- LocalStorage persistence.
- Shared filters across all views.
- URL-synchronized filters.
- Undo and redo functionality.
- Keyboard shortcuts.
- Light and dark themes.
- Responsive design for desktop, tablet, and mobile.
- Toast notifications and confirmation dialogs.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Next.js | React framework and application routing |
| React | User interface development |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling and responsive layouts |
| shadcn/ui | Reusable UI components |
| Zustand | Centralized state management |
| @dnd-kit | Drag-and-drop interactions |
| date-fns | Date manipulation |
| React Markdown | Markdown rendering |
| Recharts | Dashboard charts and analytics |
| Lucide React | Icons |
| LocalStorage | Client-side data persistence |

## 🏗️ Application Architecture

SprintFlow uses a centralized data architecture.

All project tasks are maintained in a shared Zustand store. The Kanban Board, Gantt Timeline, Calendar, and List views consume the same dataset.

This ensures that updating a task in one view automatically updates the other views without maintaining separate datasets.

**Data flow:**

`Centralized Zustand Store → Kanban | Gantt | Calendar | List`

## 📁 Project Structure

```text
sprintflow/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── calendar/
│   │   ├── timeline/
│   │   ├── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── sidebar/
│   │   ├── header/
│   │   ├── dashboard/
│   │   ├── kanban/
│   │   ├── gantt/
│   │   ├── calendar/
│   │   ├── task-list/
│   │   ├── task-drawer/
│   │   ├── filters/
│   │   └── ui/
│   │
│   ├── store/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── data/
│
├── public/
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or later
- npm

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the Project

```bash
cd sprintflow
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Development Server

```bash
npm run dev
```

### 5. Open in Browser

Visit:

```text
http://localhost:3000
```

## 💾 Data Persistence

SprintFlow uses browser LocalStorage to persist project data.

- Changes are saved locally.
- Data is restored when the application is refreshed.
- No external backend or database is required.
- The application uses realistic mock data for demonstration.

## 🎯 Project Objectives

- Build a functional project management application.
- Provide multiple synchronized task management views.
- Implement reusable and maintainable React components.
- Demonstrate centralized state management.
- Build interactive drag-and-drop functionality.
- Provide a responsive and professional user experience.

## 🔮 Future Improvements

- Real backend API integration.
- User authentication and role-based access.
- Real-time collaboration.
- Cloud-based data storage.
- Team notifications and activity updates.

## 👨‍💻 Author

**Muhammed Muqhtadeer Muzawar**

---

⭐ If you find this project useful, consider giving the repository a star!
