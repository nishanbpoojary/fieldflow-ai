import { SectionHeading } from "@/features/dashboard/components/section-heading";
import type {
  PlannedVisit,
  VisitPriority,
  VisitStatus,
} from "@/features/dashboard/types";

interface TodaysVisitsProps {
  dateLabel: string;
  visits: PlannedVisit[];
}

const statusStyles: Record<VisitStatus, string> = {
  Pending: "bg-blue-50 text-blue-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Missed: "bg-rose-50 text-rose-700",
  Cancelled: "bg-slate-100 text-slate-600",
};

const priorityStyles: Record<VisitPriority, string> = {
  High: "text-rose-700",
  Medium: "text-amber-700",
  Low: "text-slate-500",
};

export function TodaysVisits({ dateLabel, visits }: TodaysVisitsProps) {
  return (
    <section
      aria-labelledby="todays-visits-title"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div id="todays-visits-title">
          <SectionHeading
            eyebrow="Daily route"
            title="Today's assigned visits"
            description={`Your authorized customer schedule for ${dateLabel}.`}
          />
        </div>
        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          {visits.length} visit{visits.length === 1 ? "" : "s"}
        </span>
      </div>

      {visits.length > 0 ? (
        <ol className="divide-y divide-slate-100">
          {visits.map((visit, index) => (
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
                className={`w-fit text-xs font-semibold ${priorityStyles[visit.priority]}`}
              >
                {visit.priority} priority
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
            <p className="text-sm font-semibold text-slate-700">
              No assigned visits today
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Your authorized schedule has no visit plans for this date.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
