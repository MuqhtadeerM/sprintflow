"use client";

import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import { FilterChips } from "@/components/filters/filter-chips";
import { Board } from "@/components/kanban/board";
import { ListView } from "@/components/task-list/list-view";
import { useProjectContext } from "@/hooks/use-project-context";

const COMING_SOON = {
  gantt: {
    title: "Gantt view",
    note: "The Gantt timeline arrives in Step 10.",
  },
  calendar: { title: "Calendar view", note: "The calendar arrives in Step 9." },
} as const;

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
      {(view === "gantt" || view === "calendar") && (
        <PagePlaceholder
          title={COMING_SOON[view].title}
          description={COMING_SOON[view].note}
        />
      )}
    </div>
  );
}
