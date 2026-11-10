"use client";

import { useParams } from "next/navigation";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { useAppSelector } from "@/store/hooks";

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const project = useAppSelector((s) =>
    s.data.projects.find((p) => p.id === projectId),
  );
  const taskCount = useAppSelector(
    (s) => s.data.tasks.filter((t) => t.projectId === projectId).length,
  );

  if (!project) {
    return (
      <PagePlaceholder
        title="Project not found"
        description="This project doesn't exist. Choose one from the sidebar."
      />
    );
  }

  return (
    <PagePlaceholder
      title={project.name}
      description={`${taskCount} tasks. The four views arrive in the next steps.`}
    />
  );
}
