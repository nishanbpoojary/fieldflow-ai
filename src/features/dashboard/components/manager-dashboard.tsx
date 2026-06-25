import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { ManagerAnalyticsCharts } from "@/features/dashboard/components/manager-analytics-charts";
import { ManagerInsightsPanel } from "@/features/dashboard/components/manager-insights-panel";
import { ManagerPriorities } from "@/features/dashboard/components/manager-priorities";
import { ManagerWeeklyReportPanel } from "@/features/dashboard/components/manager-weekly-report-panel";
import { OverdueFollowUps } from "@/features/dashboard/components/overdue-follow-ups";
import { TeamPerformance } from "@/features/dashboard/components/team-performance";
import type { ManagerDashboardResult } from "@/features/dashboard/types";

interface ManagerDashboardProps {
  displayName: string;
  isOrganizationAdmin?: boolean;
  result: ManagerDashboardResult;
}

function DashboardState({ status }: { status: "empty" | "unavailable" }) {
  const isEmpty = status === "empty";

  return (
    <section
      aria-labelledby="manager-dashboard-state-title"
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
            id="manager-dashboard-state-title"
            className="mt-5 text-xl font-semibold tracking-tight text-slate-950"
          >
            {isEmpty
              ? "No operational records yet"
              : "Manager data is temporarily unavailable"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {isEmpty
              ? "This team has no customers, visits, follow-ups, or monthly targets to summarize. Dashboard metrics will appear when synthetic operational records are available."
              : "We could not load the current team overview. Please refresh the page or try again shortly."}
          </p>
        </div>
      </div>
    </section>
  );
}

export function ManagerDashboard({
  displayName,
  isOrganizationAdmin = false,
  result,
}: ManagerDashboardProps) {
  const periodLabel =
    result.status === "ready" ? result.data.periodLabel : result.periodLabel;
  const dateTime =
    result.status === "ready"
      ? `${result.data.weekStart}/${result.data.weekEnd}`
      : result.today;

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AppSidebar
        role="manager"
        displayName={displayName}
        isOrganizationAdmin={isOrganizationAdmin}
      />

      <main id="overview" className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  Manager Workspace
                </h1>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  Synthetic database data
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Regional sales operations overview
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
                    Weekly command center
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Welcome back, {displayName}.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                    {result.data.summary}
                  </p>
                </div>
              </section>

              <section aria-labelledby="kpi-overview-title">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2
                      id="kpi-overview-title"
                      className="text-lg font-semibold tracking-tight text-slate-950"
                    >
                      Performance snapshot
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      A focused view of this week&apos;s field activity.
                    </p>
                  </div>
                  <p className="hidden text-xs font-medium text-slate-400 sm:block">
                    Updated from authorized team records
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {result.data.kpis.map((kpi) => (
                    <KpiCard key={kpi.id} kpi={kpi} />
                  ))}
                </div>
              </section>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
                <div className="space-y-6">
                  <OverdueFollowUps
                    followUps={result.data.overdueFollowUps}
                  />
                  <TeamPerformance members={result.data.teamPerformance} />
                </div>
                <div className="space-y-6">
                  <ManagerPriorities
                    priorities={result.data.managerPriorities}
                  />
                  <ManagerInsightsPanel />
                  <ManagerWeeklyReportPanel />
                </div>
              </div>

              <ManagerAnalyticsCharts
                completionData={result.data.completionTrendChartData}
                customerStatusData={result.data.customerStatusChartData}
                executiveData={result.data.executiveVisitChartData}
                territoryData={result.data.territoryVisitChartData}
              />
            </>
          ) : (
            <DashboardState status={result.status} />
          )}

          <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>FieldFlow AI manager workspace</p>
            <p>All names and database records are synthetic portfolio data.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
