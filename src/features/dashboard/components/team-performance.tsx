import { SectionHeading } from "@/features/dashboard/components/section-heading";
import type { TeamPerformanceMember } from "@/features/dashboard/types";

interface TeamPerformanceProps {
  members: TeamPerformanceMember[];
}

export function TeamPerformance({ members }: TeamPerformanceProps) {
  return (
    <section
      aria-labelledby="team-performance-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div id="team-performance-title">
        <SectionHeading
          title="Team performance"
          description="Weekly visit completion across active territories."
        />
      </div>

      {members.length > 0 ? (
        <ul className="mt-6 space-y-5">
          {members.map((member) => (
            <li key={member.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {member.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {member.territory}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <p className="text-slate-500">
                    <span className="font-semibold text-slate-800">
                      {member.completedVisits}
                    </span>
                    /{member.plannedVisits} visits
                  </p>
                  <p className="min-w-10 text-right font-semibold text-blue-700">
                    {member.completionPercentage}%
                  </p>
                </div>
              </div>
              <div
                aria-label={`${member.name} completed ${member.completionPercentage}% of planned visits`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={member.completionPercentage}
                className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${member.completionPercentage}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <p className="text-sm font-semibold text-slate-800">
            No sales executives available
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Team performance will appear when an assigned profile is available.
          </p>
        </div>
      )}
    </section>
  );
}
