import { SectionHeading } from "@/features/dashboard/components/section-heading";
import { upcomingTasks } from "@/features/dashboard/data/sales-executive-dashboard";
import type { TaskPriority } from "@/features/dashboard/types";

const taskPriorityStyles: Record<TaskPriority, string> = {
  High: "bg-rose-50 text-rose-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

export function UpcomingTasks() {
  return (
    <section
      aria-labelledby="upcoming-tasks-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div id="upcoming-tasks-title">
        <SectionHeading
          title="Upcoming tasks"
          description="Next actions across your assigned customers."
        />
      </div>

      <ul className="mt-5 space-y-3">
        {upcomingTasks.map((task) => (
          <li key={task.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold leading-5 text-slate-900">
                  {task.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{task.customerName}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${taskPriorityStyles[task.priority]}`}
              >
                {task.priority}
              </span>
            </div>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs font-medium text-slate-600">
              Due {task.dueDate}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
