import type { DashboardKpi, KpiTone } from "@/features/dashboard/types";

const toneStyles: Record<
  KpiTone,
  { marker: string; change: string; value: string }
> = {
  blue: {
    marker: "bg-blue-500",
    change: "bg-blue-50 text-blue-700",
    value: "text-blue-950",
  },
  emerald: {
    marker: "bg-emerald-500",
    change: "bg-emerald-50 text-emerald-700",
    value: "text-emerald-950",
  },
  amber: {
    marker: "bg-amber-500",
    change: "bg-amber-50 text-amber-700",
    value: "text-amber-950",
  },
  rose: {
    marker: "bg-rose-500",
    change: "bg-rose-50 text-rose-700",
    value: "text-rose-950",
  },
  violet: {
    marker: "bg-violet-500",
    change: "bg-violet-50 text-violet-700",
    value: "text-violet-950",
  },
};

interface KpiCardProps {
  kpi: DashboardKpi;
}

export function KpiCard({ kpi }: KpiCardProps) {
  const styles = toneStyles[kpi.tone];

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60">
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${styles.marker}`}
      />
      <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${styles.value}`}>
        {kpi.value}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{kpi.context}</p>
      <span
        className={`mt-4 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles.change}`}
      >
        {kpi.change}
      </span>
    </article>
  );
}
