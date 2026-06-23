"use client";

export default function TerritoriesError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60">
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-700"
        >
          !
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
          Territories could not load
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Something went wrong while rendering this workspace. Please try again.
        </p>
        <button
          type="button"
          onClick={unstable_retry}
          className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Try again
        </button>
      </section>
    </main>
  );
}

