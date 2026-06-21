export function ChartPlaceholder() {
  return (
    <section
      aria-labelledby="chart-placeholder-title"
      className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-6"
    >
      <div className="flex min-h-28 flex-col items-center justify-center text-center">
        <span
          aria-hidden="true"
          className="mb-3 flex h-8 items-end gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
        >
          <span className="h-2 w-1.5 rounded-sm bg-blue-200" />
          <span className="h-4 w-1.5 rounded-sm bg-blue-400" />
          <span className="h-3 w-1.5 rounded-sm bg-blue-300" />
          <span className="h-5 w-1.5 rounded-sm bg-blue-600" />
        </span>
        <h2
          id="chart-placeholder-title"
          className="text-sm font-semibold text-slate-800"
        >
          Charts will appear here in the next phase
        </h2>
        <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
          Territory trends and conversion insights will be added without changing
          this phase&apos;s static workflow.
        </p>
      </div>
    </section>
  );
}
