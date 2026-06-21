import type { FormEvent } from "react";
import type { AppRole } from "@/features/dashboard/types";
import type {
  DemoTask,
  TaskPriority,
  TaskStatus,
} from "@/features/tasks/types";

interface TaskListProps {
  role: AppRole;
  tasks: DemoTask[];
  completionId: string | null;
  onStartCompletion: (taskId: string) => void;
  onCancelCompletion: () => void;
  onComplete: (taskId: string, completionNote: string) => void;
}

const statusGroups: Array<{ status: TaskStatus; label: string }> = [
  { status: "overdue", label: "Overdue" },
  { status: "due_today", label: "Due today" },
  { status: "upcoming", label: "Upcoming" },
  { status: "completed", label: "Completed" },
];

const statusStyles: Record<TaskStatus, string> = {
  overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
  due_today: "bg-amber-50 text-amber-700 ring-amber-600/20",
  upcoming: "bg-blue-50 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

const priorityStyles: Record<TaskPriority, string> = {
  high: "text-rose-700",
  medium: "text-amber-700",
  low: "text-slate-500",
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

interface CompletionFormProps {
  task: DemoTask;
  onCancel: () => void;
  onComplete: (taskId: string, completionNote: string) => void;
}

function CompletionForm({ task, onCancel, onComplete }: CompletionFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("completionNote");
    const completionNote = typeof value === "string" ? value.trim() : "";

    if (!completionNote) {
      return;
    }

    onComplete(task.id, completionNote);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 grid gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4"
      aria-label={`Complete task: ${task.title}`}
    >
      <label className="text-sm font-medium text-slate-700">
        Completion note
        <textarea
          name="completionNote"
          required
          rows={3}
          placeholder="Record what was completed"
          className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Save completion
        </button>
      </div>
    </form>
  );
}

export function TaskList({
  role,
  tasks,
  completionId,
  onStartCompletion,
  onCancelCompletion,
  onComplete,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <section
        aria-labelledby="task-list-title"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
      >
        <h2 id="task-list-title" className="text-lg font-semibold text-slate-950">
          Task queue
        </h2>
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">No tasks found</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            This demo role has no matching synthetic tasks.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="task-list-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
        Priority queue
      </p>
      <h2 id="task-list-title" className="mt-1 text-lg font-semibold text-slate-950">
        {role === "manager" ? "Team tasks" : "My tasks"}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {role === "manager"
          ? "Review team work by urgency. Managers are review-only in this demo."
          : "Complete active work and record a required completion note."}
      </p>

      <div className="mt-6 space-y-7">
        {statusGroups.map((group) => {
          const groupedTasks = tasks.filter((task) => task.status === group.status);

          if (groupedTasks.length === 0) {
            return null;
          }

          return (
            <section key={group.status} aria-labelledby={`task-group-${group.status}`}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                <h3
                  id={`task-group-${group.status}`}
                  className="text-sm font-semibold text-slate-800"
                >
                  {group.label}
                </h3>
                <span className="text-xs font-medium text-slate-400">
                  {groupedTasks.length}
                </span>
              </div>

              <ul className="mt-3 space-y-3">
                {groupedTasks.map((task) => {
                  const canComplete =
                    role === "sales_executive" && task.status !== "completed";
                  const isCompleting = completionId === task.id;

                  return (
                    <li key={task.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                      <article>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="break-words font-semibold text-slate-950">
                              {task.title}
                            </h4>
                            <p className="mt-1 break-words text-sm text-slate-600">
                              {task.customerName ?? "Internal operations"}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {task.territory} · {task.assignedSalesExecutive}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[task.status]}`}
                            >
                              {group.label}
                            </span>
                            <span
                              className={`px-1 py-1 text-xs font-semibold capitalize ${priorityStyles[task.priority]}`}
                            >
                              {task.priority} priority
                            </span>
                          </div>
                        </div>

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Due date
                            </dt>
                            <dd className="mt-1 font-medium text-slate-700">
                              {formatDate(task.dueDate)}
                            </dd>
                          </div>
                          {task.completedDate ? (
                            <div>
                              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Completed
                              </dt>
                              <dd className="mt-1 font-medium text-slate-700">
                                {formatDate(task.completedDate)}
                              </dd>
                            </div>
                          ) : null}
                        </dl>

                        {task.planningNote ? (
                          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                            <span className="font-semibold text-slate-700">Planning note:</span>{" "}
                            {task.planningNote}
                          </p>
                        ) : null}

                        {task.status === "completed" && task.completionNote ? (
                          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm leading-6 text-slate-600">
                            <span className="font-semibold text-slate-700">Completion note:</span>{" "}
                            {task.completionNote}
                          </p>
                        ) : null}

                        {canComplete && !isCompleting ? (
                          <button
                            type="button"
                            onClick={() => onStartCompletion(task.id)}
                            className="mt-4 min-h-11 w-full rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
                          >
                            Complete task
                          </button>
                        ) : null}

                        {isCompleting ? (
                          <CompletionForm
                            task={task}
                            onCancel={onCancelCompletion}
                            onComplete={onComplete}
                          />
                        ) : null}
                      </article>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
