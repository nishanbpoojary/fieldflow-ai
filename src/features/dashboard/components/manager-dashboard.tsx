import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { ManagerAnalyticsCharts } from "@/features/dashboard/components/manager-analytics-charts";
import { ManagerPriorities } from "@/features/dashboard/components/manager-priorities";
import { OverdueFollowUps } from "@/features/dashboard/components/overdue-follow-ups";
import { TeamPerformance } from "@/features/dashboard/components/team-performance";
import {
  customerStatusChartData,
  dashboardKpis,
  executiveVisitChartData,
  monthlyCompletionChartData,
  territoryVisitChartData,
} from "@/features/dashboard/data/demo-dashboard";

export function ManagerDashboard() {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <AppSidebar role="manager" />

      <main id="overview" className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                  Manager Workspace
                </h1>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
                  Demo data
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
                dateTime="2026-06-16/2026-06-22"
                className="mt-0.5 block text-sm font-semibold text-slate-700"
              >
                Week of 16-22 June 2026
              </time>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
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
                Welcome back, Avery.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
                Your team has completed 31 of 42 planned visits. Focus today on
                nine overdue follow-ups and the remaining visit gap across West
                Ridge and South District.
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
                Updated for demo presentation
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {dashboardKpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
            <div className="space-y-6">
              <OverdueFollowUps />
              <TeamPerformance />
            </div>
            <div className="space-y-6">
              <ManagerPriorities />
            </div>
          </div>

          <ManagerAnalyticsCharts
            completionData={monthlyCompletionChartData}
            customerStatusData={customerStatusChartData}
            executiveData={executiveVisitChartData}
            territoryData={territoryVisitChartData}
          />

          <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>FieldFlow AI manager workspace</p>
            <p>All names and operational records are synthetic demo data.</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
