"use client";

export default function ProfileSettingsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <section
        className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60"
        role="alert"
      >
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-700"
        >
          !
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Profile Settings are temporarily unavailable
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
          We could not load this settings workspace right now. Please try again
          shortly.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
