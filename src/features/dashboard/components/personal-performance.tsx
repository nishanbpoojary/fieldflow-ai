import { SectionHeading } from "@/features/dashboard/components/section-heading";
import type { PersonalPerformance as PersonalPerformanceData } from "@/features/dashboard/types";

interface PersonalPerformanceProps {
  performance: PersonalPerformanceData;
}

export function PersonalPerformance({
  performance,
}: PersonalPerformanceProps) {
  return (
    <section
      aria-labelledby="personal-performance-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div id="personal-performance-title">
        <SectionHeading
          eyebrow="Month to date"
          title="Personal performance"
          description="Completed visit records compared with non-cancelled plans."
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-medium text-slate-500">Planned visits</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {performance.plannedVisits}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-700">Completed visits</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-950">
            {performance.completedVisits}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-600">Completion progress</span>
          <span className="font-semibold text-blue-700">
            {performance.completionPercentage}%
          </span>
        </div>
        <div
          aria-label={`${performance.completionPercentage}% of planned visits completed`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={performance.completionPercentage}
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-blue-600"
            style={{ width: `${performance.completionPercentage}%` }}
          />
        </div>
      </div>

      <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-slate-700">
        {performance.summary}
      </p>
    </section>
  );
}
