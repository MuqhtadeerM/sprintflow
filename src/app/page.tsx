"use client";

import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addTask,
  deleteTask,
  moveTask,
  resetData,
} from "@/store/slices/data-slice";

export default function Home() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((s) =>
    s.data.tasks.filter((t) => t.projectId === "p1"),
  );
  const columns = useAppSelector((s) =>
    s.data.columns.filter((c) => c.projectId === "p1"),
  );
  const hydrated = useAppSelector((s) => s.ui.hydrated);

  if (!hydrated) return <p className="p-8">Loading…</p>;

  return (
    <main className="space-y-4 p-8">
      <div className="flex gap-2">
        <Button
          onClick={() =>
            dispatch(
              addTask({
                projectId: "p1",
                sprintId: "s2",
                title: "New task",
                columnId: "c1",
              }),
            )
          }
        >
          Add task to Backlog
        </Button>
        <Button variant="outline" onClick={() => dispatch(resetData())}>
          Reset
        </Button>
      </div>

      {columns.map((col) => (
        <section key={col.id}>
          <h2 className="font-semibold">
            {col.name} ({tasks.filter((t) => t.columnId === col.id).length}
            {col.wipLimit ? ` / ${col.wipLimit}` : ""})
          </h2>
          <ul className="ml-4 list-disc">
            {tasks
              .filter((t) => t.columnId === col.id)
              .sort((a, b) => a.order - b.order)
              .map((t) => (
                <li key={t.id} className="space-x-2">
                  <span>{t.title}</span>
                  <button
                    className="text-xs underline"
                    onClick={() =>
                      dispatch(
                        moveTask({
                          taskId: t.id,
                          toColumnId: "c3",
                          toIndex: 0,
                        }),
                      )
                    }
                  >
                    → In Progress
                  </button>
                  <button
                    className="text-xs text-red-500 underline"
                    onClick={() => dispatch(deleteTask(t.id))}
                  >
                    delete
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
