"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

/** Opens a view of the first project, across all sprints. */
export function RedirectToProject({ view }: { view: "calendar" | "gantt" }) {
  const router = useRouter();
  const projectId = useAppSelector((s) => s.data.projects[0]?.id);

  useEffect(() => {
    if (projectId)
      router.replace(`/projects/${projectId}?view=${view}&sprint=all`);
  }, [projectId, router, view]);

  return (
    <p
      className="py-10 text-center text-sm text-muted-foreground"
      aria-busy="true"
    >
      {projectId ? "Opening…" : "Create a project first."}
    </p>
  );
}
