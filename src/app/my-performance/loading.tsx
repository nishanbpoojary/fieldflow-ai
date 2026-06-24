export default function MyPerformanceLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-6 w-52 rounded-full bg-slate-200" />
        <div className="mt-5 h-10 w-full max-w-lg rounded-xl bg-slate-200" />
        <div className="mt-3 h-5 w-full max-w-2xl rounded bg-slate-200" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-36 rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
          <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
          <div className="h-96 rounded-2xl border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
