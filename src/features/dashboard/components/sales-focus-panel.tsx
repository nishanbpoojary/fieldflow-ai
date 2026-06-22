import type { SalesFocus } from "@/features/dashboard/types";

interface SalesFocusPanelProps {
  focus: SalesFocus;
}

export function SalesFocusPanel({ focus }: SalesFocusPanelProps) {
  return (
    <aside
      aria-labelledby="daily-focus-title"
      className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-lg shadow-slate-300/50 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300">
        Daily focus
      </p>
      <h2 id="daily-focus-title" className="mt-2 text-lg font-semibold">
        {focus.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">{focus.detail}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
        <div>
          <p className="text-2xl font-semibold text-white">
            {focus.pendingVisits}
          </p>
          <p className="mt-1 text-xs text-slate-400">Pending visits today</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-rose-300">
            {focus.overdueWork}
          </p>
          <p className="mt-1 text-xs text-slate-400">Overdue work items</p>
        </div>
      </div>
    </aside>
  );
}
