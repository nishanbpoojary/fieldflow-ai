import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { FollowUpWorkflow } from "@/features/follow-ups/components/follow-up-workflow";
import type {
  DemoFollowUp,
  FollowUpCustomerOption,
  FollowUpPageContext,
} from "@/features/follow-ups/types";

interface FollowUpPageShellProps {
  context: FollowUpPageContext;
  initialFollowUps: DemoFollowUp[];
  customers: FollowUpCustomerOption[];
  demoToday: string;
}

function formatOverviewDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function FollowUpPageShell({
  context,
  initialFollowUps,
  customers,
  demoToday,
}: FollowUpPageShellProps) {
  const isManager = context.role === "manager";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <AppSidebar role={context.role} activeItem="follow-ups" />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
                  Demo data
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {context.roleLabel} view
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {isManager ? "Team Follow-up Tracker" : "My Follow-ups"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {isManager
                  ? "Review synthetic team commitments across customers and territories."
                  : "Plan and complete Maya Chen’s synthetic customer commitments."}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {formatOverviewDate(demoToday)}
            </p>
          </header>

          <aside
            className="my-6 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-900"
            aria-label="Demo reset and authorization notice"
          >
            Changes use session-only browser state and reset when this page is
            refreshed. Role filtering is for demonstration only, not real
            authentication or authorization.
          </aside>

          <FollowUpWorkflow
            context={context}
            initialFollowUps={initialFollowUps}
            customers={customers}
            demoToday={demoToday}
          />
        </div>
      </main>
    </div>
  );
}
