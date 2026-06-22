"use client";

import { useMemo, useState } from "react";
import { TaskList } from "@/features/tasks/components/task-list";
import { TaskSummary } from "@/features/tasks/components/task-summary";
import type {
  TaskPageContext,
  TaskRecord,
  TaskStatus,
} from "@/features/tasks/types";

interface TaskWorkflowProps {
  context: TaskPageContext;
  tasks: TaskRecord[];
}

type TaskFilter = "all" | TaskStatus;

const filters: Array<{ value: TaskFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "overdue", label: "Overdue" },
  { value: "due_today", label: "Due today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function TaskWorkflow({ context, tasks }: TaskWorkflowProps) {
  const [activeFilter, setActiveFilter] = useState<TaskFilter>("all");
  const [successMessage, setSuccessMessage] = useState("");
  const counts = useMemo<Record<TaskStatus, number>>(
    () => ({
      overdue: tasks.filter((task) => task.status === "overdue").length,
      due_today: tasks.filter((task) => task.status === "due_today").length,
      upcoming: tasks.filter((task) => task.status === "upcoming").length,
      completed: tasks.filter((task) => task.status === "completed").length,
      cancelled: tasks.filter((task) => task.status === "cancelled").length,
    }),
    [tasks],
  );
  const visibleTasks = useMemo(
    () =>
      activeFilter === "all"
        ? tasks
        : tasks.filter((task) => task.status === activeFilter),
    [activeFilter, tasks],
  );

  return (
    <div className="space-y-6">
      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {successMessage}
        </div>
      ) : null}

      <TaskSummary counts={counts} />

      <nav aria-label="Filter task queue" className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const isActive = filter.value === activeFilter;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              aria-pressed={isActive}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isActive
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </nav>

      <TaskList
        role={context.role}
        tasks={visibleTasks}
        hasAuthorizedTasks={tasks.length > 0}
        onTaskCompleted={() =>
          setSuccessMessage(
            "Task completed. The live queue, summary, and completion details have been refreshed.",
          )
        }
      />
    </div>
  );
}
