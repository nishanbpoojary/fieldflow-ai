import type { AppRole } from "@/features/dashboard/types";
import { CompleteTaskAction } from "@/features/tasks/components/complete-task-action";
import type {
  TaskPriority,
  TaskRecord,
  TaskStatus,
} from "@/features/tasks/types";

interface TaskListProps {
  role: AppRole;
  tasks: TaskRecord[];
  hasAuthorizedTasks: boolean;
  onTaskCompleted: () => void;
}

const statusGroups: Array<{ status: TaskStatus; label: string }> = [
  { status: "overdue", label: "Overdue" },
  { status: "due_today", label: "Due today" },
  { status: "upcoming", label: "Upcoming" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<TaskStatus, string> = {
  overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
  due_today: "bg-amber-50 text-amber-700 ring-amber-600/20",
  upcoming: "bg-blue-50 text-blue-700 ring-blue-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const priorityStyles: Record<TaskPriority, string> = {
  high: "text-rose-700",
  medium: "text-amber-700",
  low: "text-slate-500",
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatCompletedAt(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function TaskList({
  role,
  tasks,
  hasAuthorizedTasks,
  onTaskCompleted,
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
          <p className="text-sm font-semibold text-slate-700">
            {hasAuthorizedTasks
              ? "No tasks match this filter"
              : "No authorized tasks"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {hasAuthorizedTasks
              ? "Choose another status to review the rest of your task queue."
              : "There are no task records available in your authorized workspace."}
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
        Open work is ordered by urgency, followed by completed and cancelled
        records.
      </p>

      <div className="mt-6 space-y-7">
        {statusGroups.map((group) => {
          const groupedTasks = tasks.filter((task) => task.status === group.status);

          if (groupedTasks.length === 0) return null;

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
                {groupedTasks.map((task) => (
                  <li key={task.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                    <article>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h4 className="break-words font-semibold text-slate-950">
                            {task.title}
                          </h4>
                          <p className="mt-1 break-words text-sm text-slate-600">
                            {task.customerName ?? "Internal operations task"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {task.territory ? `${task.territory} · ` : ""}
                            {task.assignedSalesExecutive}
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

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Due date
                          </dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {formatDate(task.dueDate)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Database state
                          </dt>
                          <dd className="mt-1 font-medium capitalize text-slate-700">
                            {task.state}
                          </dd>
                        </div>
                        {task.completedAt ? (
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Completed
                            </dt>
                            <dd className="mt-1 font-medium text-slate-700">
                              {formatCompletedAt(task.completedAt)}
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

                      {task.state === "completed" && task.completionNote ? (
                        <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm leading-6 text-slate-600">
                          <span className="font-semibold text-slate-700">Completion note:</span>{" "}
                          {task.completionNote}
                        </p>
                      ) : null}

                      <CompleteTaskAction
                        taskId={task.id}
                        state={task.state}
                        isSalesExecutive={role === "sales_executive"}
                        onSuccess={onTaskCompleted}
                      />
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
