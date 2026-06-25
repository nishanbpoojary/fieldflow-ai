import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { AssignedCustomers } from "@/features/dashboard/components/assigned-customers";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { PersonalPerformance } from "@/features/dashboard/components/personal-performance";
import { SalesFocusPanel } from "@/features/dashboard/components/sales-focus-panel";
import { TodaysVisits } from "@/features/dashboard/components/todays-visits";
import { UpcomingTasks } from "@/features/dashboard/components/upcoming-tasks";
import type { SalesExecutiveDashboardResult } from "@/features/dashboard/types";

interface SalesExecutiveDashboardProps {
  displayName: string;
  jobTitle?: string | null;
  isOrganizationAdmin?: boolean;
  result: SalesExecutiveDashboardResult;
}

function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function DashboardState({ status }: { status: "empty" | "unavailable" }) {
  const isEmpty = status === "empty";

  return (
    <section
      aria-labelledby="sales-dashboard-state-title"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60"
    >
      <div className="grid min-h-96 place-items-center px-6 py-14 text-center">
        <div className="max-w-lg">
          <span
            aria-hidden="true"
            className={`mx-auto grid size-14 place-items-center rounded-2xl text-lg font-bold ${
              isEmpty
                ? "bg-blue-50 text-blue-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {isEmpty ? "0" : "!"}
          </span>
          <h2
            id="sales-dashboard-state-title"
            className="mt-5 text-xl font-semibold tracking-tight text-slate-950"
          >
            {isEmpty
              ? "No assigned operational records"
              : "Dashboard data is temporarily unavailable"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {isEmpty
              ? "Customers, visits, follow-ups, and tasks will appear here when records are assigned to your profile."
              : "We could not load your authorized activity overview. Please refresh the page or try again shortly."}
          </p>
        </div>
      </div>
    </section>
  );
}

export function SalesExecutiveDashboard({
  displayName,
  jobTitle,
  isOrganizationAdmin = false,
  result,
}: SalesExecutiveDashboardProps) {
  const periodLabel =
    result.status === "ready" ? result.data.periodLabel : result.periodLabel;
  const dateTime =
    result.status === "ready"
      ? `${result.data.weekStart}/${result.data.weekEnd}`
      : result.today;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AppSidebar
        role="sales_executive"
        displayName={displayName}
        jobTitle={jobTitle}
        isOrganizationAdmin={isOrganizationAdmin}
      />

      <main id="overview" className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  Sales Executive Workspace
                </h1>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  Synthetic database data
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Authorized personal field activity overview
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Overview period
              </p>
              <time
                dateTime={dateTime}
                className="mt-0.5 block text-sm font-semibold text-slate-700"
              >
                {periodLabel}
              </time>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
          {result.status === "ready" ? (
            <>
              <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white shadow-lg shadow-slate-300/50 sm:px-7 sm:py-7">
                <div
                  aria-hidden="true"
                  className="absolute -right-16 -top-24 size-64 rounded-full bg-blue-600/20 blur-3xl"
                />
                <div className="relative max-w-3xl">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
                    Today&apos;s field plan
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Welcome back, {displayName}.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                    {result.data.summary}
                  </p>
                </div>
              </section>

              <section aria-labelledby="sales-kpi-title">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2
                      id="sales-kpi-title"
                      className="text-lg font-semibold tracking-tight text-slate-950"
                    >
                      My activity snapshot
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Your current customer, visit, follow-up, and task workload.
                    </p>
                  </div>
                  <p className="hidden text-xs font-medium text-slate-400 sm:block">
                    Updated from authorized assigned records
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                  {result.data.kpis.map((kpi) => (
                    <KpiCard key={kpi.id} kpi={kpi} />
                  ))}
                </div>
              </section>

              <TodaysVisits
                dateLabel={formatDateLabel(result.data.today)}
                visits={result.data.todaysVisits}
              />

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
                <div className="space-y-6">
                  <AssignedCustomers
                    customers={result.data.assignedCustomers}
                  />
                  <PersonalPerformance
                    performance={result.data.performance}
                  />
                </div>
                <div className="space-y-6">
                  <UpcomingTasks priorities={result.data.priorities} />
                  <SalesFocusPanel focus={result.data.focus} />
                </div>
              </div>
            </>
          ) : (
            <DashboardState status={result.status} />
          )}

          <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>FieldFlow AI sales executive workspace</p>
            <p>All names and database records are synthetic portfolio data.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
