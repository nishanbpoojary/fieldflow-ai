export function SalesFocusPanel() {
  return (
    <aside
      aria-labelledby="daily-focus-title"
      className="overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-lg shadow-slate-300/50 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-300">
        Daily reminder
      </p>
      <h2 id="daily-focus-title" className="mt-2 text-lg font-semibold">
        Protect the 1:30 PM priority visit
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Review Summit Drive Works&apos; open requirements before leaving for the
        appointment, then clear the two overdue follow-ups before end of day.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
        <div>
          <p className="text-2xl font-semibold text-white">3</p>
          <p className="mt-1 text-xs text-slate-400">Visits remaining</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-rose-300">2</p>
          <p className="mt-1 text-xs text-slate-400">Overdue follow-ups</p>
        </div>
      </div>
    </aside>
  );
}
