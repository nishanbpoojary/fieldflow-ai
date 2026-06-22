import { SectionHeading } from "@/features/dashboard/components/section-heading";
import type { OverdueFollowUp } from "@/features/dashboard/types";

interface OverdueFollowUpsProps {
  followUps: OverdueFollowUp[];
}

export function OverdueFollowUps({ followUps }: OverdueFollowUpsProps) {
  return (
    <section
      aria-labelledby="overdue-follow-ups-title"
      className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60"
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div id="overdue-follow-ups-title">
          <SectionHeading
            eyebrow="Attention needed"
            title="Overdue follow-ups"
            description="Customer commitments that need a manager check-in."
          />
        </div>
        <span className="inline-flex w-fit rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
          {followUps.length} overdue
        </span>
      </div>

      {followUps.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {followUps.map((followUp) => (
            <li
              key={followUp.id}
              className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] sm:px-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(110px,.75fr)_minmax(120px,.8fr)_minmax(130px,1fr)] xl:items-center"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {followUp.customerName}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {followUp.territory}
                </p>
              </div>
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    followUp.priority === "High"
                      ? "bg-rose-50 text-rose-700"
                      : followUp.priority === "Medium"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {followUp.priority} priority
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 xl:hidden">
                  Due status
                </p>
                <p className="mt-1 text-sm font-medium text-rose-700 xl:mt-0">
                  {followUp.dueStatus}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Assigned to
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {followUp.assignedExecutive}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-5 py-8 text-center sm:px-6">
          <p className="text-sm font-semibold text-slate-800">
            No overdue follow-ups
          </p>
          <p className="mt-1 text-sm text-slate-500">
            There are no open follow-ups due before today.
          </p>
        </div>
      )}
    </section>
  );
}
