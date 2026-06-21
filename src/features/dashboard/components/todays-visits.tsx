import { SectionHeading } from "@/features/dashboard/components/section-heading";
import { todaysPlannedVisits } from "@/features/dashboard/data/sales-executive-dashboard";
import type { VisitStatus } from "@/features/dashboard/types";

const statusStyles: Record<VisitStatus, string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  Scheduled: "bg-blue-50 text-blue-700",
  Pending: "bg-slate-100 text-slate-600",
};

export function TodaysVisits() {
  return (
    <section
      aria-labelledby="todays-visits-title"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div id="todays-visits-title">
          <SectionHeading
            eyebrow="Daily route"
            title="Today's planned visits"
            description="Your customer schedule for 21 June 2026."
          />
        </div>
        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          5 visits
        </span>
      </div>

      <ol className="divide-y divide-slate-100">
        {todaysPlannedVisits.map((visit, index) => (
          <li
            key={visit.id}
            className="grid gap-3 px-5 py-4 sm:grid-cols-[auto_minmax(0,1.4fr)_minmax(110px,.7fr)] sm:items-center sm:px-6 xl:grid-cols-[auto_minmax(0,1.5fr)_minmax(100px,.65fr)_minmax(110px,.7fr)_minmax(90px,.55fr)]"
          >
            <span
              aria-hidden="true"
              className="grid size-7 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-500"
            >
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {visit.customerName}
              </p>
              <p className="mt-1 text-xs text-slate-500">{visit.territory}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:hidden xl:block">
                Time
              </p>
              <time className="mt-1 block text-sm font-medium text-slate-700">
                {visit.scheduledTime}
              </time>
            </div>
            <span
              className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[visit.status]}`}
            >
              {visit.status}
            </span>
            <span
              className={`w-fit text-xs font-semibold ${
                visit.priority === "High" ? "text-rose-700" : "text-slate-400"
              }`}
            >
              {visit.priority} priority
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
