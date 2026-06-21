import { dashboardNavigation } from "@/features/dashboard/data/demo-dashboard";

export function AppSidebar() {
  return (
    <aside className="bg-slate-950 text-slate-100 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:shrink-0 lg:flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-5 lg:block lg:border-b-0 lg:px-6 lg:py-7">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-blue-600 text-sm font-bold tracking-tight text-white shadow-lg shadow-blue-950/30"
          >
            FF
          </span>
          <div>
            <p className="text-base font-semibold tracking-tight text-white">
              FieldFlow AI
            </p>
            <p className="text-xs text-slate-400">Operations copilot</p>
          </div>
        </div>
        <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-200 lg:mt-5 lg:inline-flex">
          Manager
        </span>
      </div>

      <nav aria-label="Manager workspace" className="px-3 py-4 lg:px-4 lg:py-2">
        <p className="hidden px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:block">
          Workspace
        </p>
        <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:block lg:space-y-1.5">
          {dashboardNavigation.map((item) => (
            <li key={item.label}>
              <span
                aria-current={item.active ? "page" : undefined}
                className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium lg:min-h-11 ${
                  item.active
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-950/40"
                    : "text-slate-400"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-bold ${
                    item.active
                      ? "bg-white/15 text-white"
                      : "bg-white/5 text-slate-500"
                  }`}
                >
                  {item.shortLabel}
                </span>
                <span className="truncate">{item.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto hidden border-t border-white/10 p-4 lg:block">
        <div className="rounded-xl bg-white/5 p-3.5">
          <p className="text-sm font-medium text-white">Avery Morgan</p>
          <p className="mt-0.5 text-xs text-slate-400">Regional Sales Manager</p>
          <p className="mt-3 text-[11px] text-slate-500">Synthetic demo profile</p>
        </div>
      </div>
    </aside>
  );
}
