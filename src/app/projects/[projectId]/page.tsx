"use client";

import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import { FilterChips } from "@/components/filters/filter-chips";
import { Board } from "@/components/kanban/board";
import { CalendarView } from "@/components/calendar/calendar-view";
import { ListView } from "@/components/task-list/list-view";
import { useProjectContext } from "@/hooks/use-project-context";
import { GanttChart } from "@/components/gantt/gantt-chart";

export default function ProjectPage() {
  const { projectId, project, sprintId, sprint, view } = useProjectContext();

  if (!project || !projectId) {
    return (
      <PagePlaceholder
        title="Project not found"
        description="This project doesn't exist. Choose one from the sidebar."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.description}</p>
      </div>

      <ProjectOverview
        projectId={projectId}
        sprintId={sprintId}
        sprint={sprint}
      />

      <FilterChips />

      {view === "board" && <Board projectId={projectId} sprintId={sprintId} />}
      {view === "list" && (
        <ListView projectId={projectId} sprintId={sprintId} />
      )}
      {view === "calendar" && (
        <CalendarView projectId={projectId} sprintId={sprintId} />
      )}
      {view === "gantt" && (
        <PagePlaceholder
          title="Gantt view"
          description="The Gantt timeline arrives in Step 10."
        />
      )}
      {view === "gantt" && (
        <GanttChart projectId={projectId} sprintId={sprintId} sprint={sprint} />
      )}
    </div>
  );
}
