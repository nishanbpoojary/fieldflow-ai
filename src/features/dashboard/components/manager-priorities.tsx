import { SectionHeading } from "@/features/dashboard/components/section-heading";
import { managerPriorities } from "@/features/dashboard/data/demo-dashboard";
import type { PriorityTone } from "@/features/dashboard/types";

const priorityStyles: Record<PriorityTone, { number: string; border: string }> = {
  critical: {
    number: "bg-rose-100 text-rose-700",
    border: "border-l-rose-400",
  },
  attention: {
    number: "bg-amber-100 text-amber-700",
    border: "border-l-amber-400",
  },
  opportunity: {
    number: "bg-emerald-100 text-emerald-700",
    border: "border-l-emerald-400",
  },
};

export function ManagerPriorities() {
  return (
    <section
      aria-labelledby="manager-priorities-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div id="manager-priorities-title">
        <SectionHeading
          eyebrow="Operational focus"
          title="Manager priorities"
          description="Suggested actions based only on this page's demo metrics."
        />
      </div>

      <ol className="mt-5 space-y-3">
        {managerPriorities.map((priority, index) => {
          const styles = priorityStyles[priority.tone];

          return (
            <li
              key={priority.id}
              className={`rounded-xl border border-slate-200 border-l-4 bg-slate-50/70 p-4 ${styles.border}`}
            >
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${styles.number}`}
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {priority.label}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {priority.detail}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-800">
                    {priority.action}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
