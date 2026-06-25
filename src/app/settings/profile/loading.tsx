export default function ProfileSettingsLoading() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section
        className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-semibold text-slate-900">
          Loading Profile Settings
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Preparing your active profile settings workspace.
        </p>
      </section>
    </main>
  );
}
