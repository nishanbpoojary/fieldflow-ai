export default function OrganizationUsersLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
      <div
        aria-busy="true"
        aria-live="polite"
        className="mx-auto max-w-7xl animate-pulse"
        role="status"
      >
        <span className="sr-only">Loading organization users</span>
        <div className="h-6 w-52 rounded-full bg-slate-200" />
        <div className="mt-5 h-10 w-full max-w-lg rounded-xl bg-slate-200" />
        <div className="mt-3 h-5 w-full max-w-2xl rounded bg-slate-200" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-32 rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
        <div className="mt-6 h-96 rounded-2xl border border-slate-200 bg-white" />
      </div>
    </main>
  );
}
