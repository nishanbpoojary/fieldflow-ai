import { SectionHeading } from "@/features/dashboard/components/section-heading";
import type {
  SalesPriorityItem,
  SalesPriorityStatus,
  TaskPriority,
} from "@/features/dashboard/types";

interface UpcomingTasksProps {
  priorities: SalesPriorityItem[];
}

const priorityStyles: Record<TaskPriority, string> = {
  High: "bg-rose-50 text-rose-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

const urgencyStyles: Record<SalesPriorityStatus, string> = {
  Overdue: "text-rose-700",
  "Due today": "text-amber-700",
  Upcoming: "text-slate-600",
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function UpcomingTasks({ priorities }: UpcomingTasksProps) {
  return (
    <section
      aria-labelledby="upcoming-tasks-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div id="upcoming-tasks-title">
        <SectionHeading
          title="Action priorities"
          description="Your most urgent open follow-ups and tasks."
        />
      </div>

      {priorities.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {priorities.map((priority) => (
            <li key={priority.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                    {priority.kind} · {priority.state}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold leading-5 text-slate-900">
                    {priority.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {priority.customerName ?? "Internal operations"}
                    {priority.territory ? ` · ${priority.territory}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyles[priority.priority]}`}
                >
                  {priority.priority}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs font-medium">
                <span className={urgencyStyles[priority.status]}>
                  {priority.status}
                </span>
                <time className="text-slate-600">
                  Due {formatDate(priority.dueDate)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-7 text-center">
          <p className="text-sm font-semibold text-emerald-800">
            No urgent work
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-700">
            You have no open assigned follow-ups or tasks requiring attention.
          </p>
        </div>
      )}
    </section>
  );
}
