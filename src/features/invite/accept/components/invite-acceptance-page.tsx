import Link from "next/link";

import { InviteAcceptanceForm } from "@/features/invite/accept/components/invite-acceptance-form";

interface InviteAcceptancePageProps {
  initialDisplayName: string;
}

export function InviteAcceptancePage({
  initialDisplayName,
}: InviteAcceptancePageProps) {
  return (
    <main className="min-h-dvh bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section
        aria-labelledby="invite-accept-title"
        className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl items-center justify-center"
      >
        <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          <aside className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-300/60 sm:p-8">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-sm font-bold shadow-lg shadow-blue-950/30"
              >
                FF
              </span>
              <div>
                <p className="font-semibold tracking-tight">FieldFlow AI</p>
                <p className="text-sm text-slate-300">Operations copilot</p>
              </div>
            </div>

            <div className="mt-12">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
                Secure invite
              </p>
              <h1
                id="invite-accept-title"
                className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                Complete your account
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Set your workspace name and password to finish joining
                FieldFlow AI. Your role and assignments are handled securely by
                your administrator.
              </p>
            </div>
          </aside>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-300/50 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Account setup
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              Choose your sign-in details
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Passwords are sent only to Supabase Auth for this authenticated
              invite session. FieldFlow AI does not display or store them.
            </p>

            <InviteAcceptanceForm initialDisplayName={initialDisplayName} />
          </div>
        </div>
      </section>
    </main>
  );
}

export function InviteUnavailablePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <section
        aria-labelledby="invite-unavailable-title"
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl shadow-slate-300/50 sm:p-8"
      >
        <span
          aria-hidden="true"
          className="mx-auto grid size-12 place-items-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200"
        >
          FF
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
          Secure invite
        </p>
        <h1
          id="invite-unavailable-title"
          className="mt-2 text-2xl font-semibold tracking-tight"
        >
          Invitation completion unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          We could not open this account-completion page. Please sign in again
          from your invitation link or contact your FieldFlow AI administrator.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
