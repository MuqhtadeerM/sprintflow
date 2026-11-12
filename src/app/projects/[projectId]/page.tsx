"use client";

import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { ProjectOverview } from "@/components/dashboard/project-overview";
import { useProjectContext } from "@/hooks/use-project-context";

const VIEW_NOTES = {
  board: "The Kanban board arrives in Step 8.",
  gantt: "The Gantt timeline arrives in Step 10.",
  calendar: "The calendar arrives in Step 9.",
  list: "The task list arrives in Step 5.",
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

      <PagePlaceholder
        title={`${view[0].toUpperCase()}${view.slice(1)} view`}
        description={VIEW_NOTES[view]}
      />
    </div>
  );
}
