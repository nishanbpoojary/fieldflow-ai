import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import type {
  MyPerformanceData,
  MyPerformancePageContext,
  MyPerformanceResult,
  MyPerformanceSummary,
  MyPerformanceTerritoryCoverage,
  MyPerformanceTrendPoint,
  MyPerformanceWorkload,
} from "@/features/my-performance/types";

interface MyPerformanceWorkspaceProps {
  context: MyPerformancePageContext;
  displayName: string;
  result: MyPerformanceResult;
}

export function MyPerformanceWorkspace({
  context,
  displayName,
  result,
}: MyPerformanceWorkspaceProps) {
  const periodLabel =
    result.status === "ready" ? result.data.periodLabel : result.periodLabel;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <AppSidebar
        role={context.role}
        displayName={displayName}
        activeItem="my-performance"
      />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">
                  Synthetic database data
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Sales Executive-only view
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                My Performance Workspace
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                A focused view of your authorized customer coverage, visit execution,
                and personal follow-up and task workload.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Current week
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {periodLabel}
              </p>
            </div>
          </header>

          {result.status === "unavailable" ? (
            <PerformanceState
              title="My performance is temporarily unavailable"
              description="We could not load your authorized performance metrics right now. Please refresh the page or try again shortly."
              tone="warning"
            />
          ) : result.status === "empty" ? (
            <PerformanceState
              title="No assigned records found"
              description="Customers, visits, follow-ups, and tasks will appear here when records are assigned to your profile."
              tone="empty"
            />
          ) : (
            <PerformanceContent data={result.data} displayName={displayName} />
          )}
        </div>
      </main>
    </div>
  );
}

export function MyPerformanceAccessDenied({
  context,
  displayName,
}: {
  context: MyPerformancePageContext;
  displayName: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <AppSidebar role={context.role} displayName={displayName} />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60">
          <span
            aria-hidden="true"
            className="mx-auto grid size-12 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-700"
          >
            !
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Sales Executive workspace required
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            My Performance contains individual workload and execution metrics. It is
            available only to authenticated Sales Executives.
          </p>
        </section>
      </main>
    </div>
  );
}

function PerformanceContent({
  data,
  displayName,
}: {
  data: MyPerformanceData;
  displayName: string;
}) {
  return (
    <div className="mt-6 space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white shadow-lg shadow-slate-300/50 sm:px-7 sm:py-7">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 size-64 rounded-full bg-blue-600/20 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
            Personal execution summary
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {displayName}, you are at {data.summary.monthlyCompletionRate}% this month.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
            {data.summary.monthlyCompletedVisits} of{" "}
            {data.summary.monthlyPlannedVisits} non-cancelled planned visits are
            completed month to date. You have {data.workload.totalOverdueWork}{" "}
            overdue follow-up or task item
            {data.workload.totalOverdueWork === 1 ? "" : "s"}.
          </p>
        </div>
      </section>

      <section aria-labelledby="my-performance-summary-title">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Personal summary
          </p>
          <h2
            id="my-performance-summary-title"
            className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
          >
            Current assigned workload and visit execution
          </h2>
        </div>
        <SummaryGrid summary={data.summary} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
        <div className="space-y-6">
          <TrendPanel trend={data.dailyTrend} />
          <TerritoryCoveragePanel coverage={data.territoryCoverage} />
        </div>
        <WorkloadPanel workload={data.workload} />
      </div>

      <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>FieldFlow AI my performance</p>
        <p>Metrics are scoped to the authenticated Sales Executive profile.</p>
      </footer>
    </div>
  );
}

function SummaryGrid({ summary }: { summary: MyPerformanceSummary }) {
  const cards = [
    {
      label: "Assigned Customers",
      value: summary.assignedCustomerCount.toLocaleString(),
      detail: `${summary.atRiskCustomerCount} at-risk assigned customer${summary.atRiskCustomerCount === 1 ? "" : "s"}`,
    },
    {
      label: "Monthly Planned Visits",
      value: summary.monthlyPlannedVisits.toLocaleString(),
      detail: "Current month, cancelled plans excluded",
    },
    {
      label: "Monthly Completed Visits",
      value: summary.monthlyCompletedVisits.toLocaleString(),
      detail: "Completed visit records this month",
    },
    {
      label: "Monthly Completion Rate",
      value: `${summary.monthlyCompletionRate}%`,
      detail: "Completed visits divided by planned visits",
    },
    {
      label: "Today's Visit Plan",
      value: summary.todaysPlannedVisits.toLocaleString(),
      detail: `${summary.todaysCompletedVisits} completed, ${summary.todaysPendingVisits} pending`,
    },
    {
      label: "Open Work",
      value: (summary.openFollowUps + summary.openTasks).toLocaleString(),
      detail: `${summary.overdueFollowUps + summary.overdueTasks} overdue items`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {card.label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {card.value}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
        </article>
      ))}
    </div>
  );
}

function TrendPanel({ trend }: { trend: MyPerformanceTrendPoint[] }) {
  const largestValue = Math.max(
    1,
    ...trend.map((item) => Math.max(item.plannedVisits, item.completedVisits)),
  );

  return (
    <section
      aria-labelledby="weekly-trend-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          Current week
        </p>
        <h2
          id="weekly-trend-title"
          className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
        >
          Daily planned versus completed visits
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          A day-by-day view of your assigned visit plans and completed visit records.
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {trend.map((item) => (
          <div key={item.date} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-xs font-semibold text-slate-500">
                {item.completedVisits}/{item.plannedVisits}
              </span>
            </div>
            <div className="grid gap-1.5">
              <TrendBar
                label="Planned"
                value={item.plannedVisits}
                max={largestValue}
                tone="planned"
              />
              <TrendBar
                label="Completed"
                value={item.completedVisits}
                max={largestValue}
                tone="completed"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrendBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "planned" | "completed";
}) {
  const width = `${Math.round((value / max) * 100)}%`;

  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_32px] items-center gap-2 text-xs">
      <span className="font-medium text-slate-500">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            tone === "planned" ? "bg-blue-300" : "bg-blue-600"
          }`}
          style={{ width }}
        />
      </div>
      <span className="text-right font-semibold text-slate-600">{value}</span>
    </div>
  );
}

function TerritoryCoveragePanel({
  coverage,
}: {
  coverage: MyPerformanceTerritoryCoverage[];
}) {
  return (
    <section
      aria-labelledby="territory-coverage-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          Territory coverage
        </p>
        <h2
          id="territory-coverage-title"
          className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
        >
          Assigned customer territories
        </h2>
      </div>

      {coverage.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
          No assigned customer territories are available yet.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {coverage.map((territory) => (
            <article
              key={territory.territoryName}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                {territory.territoryName}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {territory.assignedCustomerCount} assigned customer
                {territory.assignedCustomerCount === 1 ? "" : "s"} ·{" "}
                {territory.atRiskCustomerCount} at risk
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function WorkloadPanel({ workload }: { workload: MyPerformanceWorkload }) {
  return (
    <section
      aria-labelledby="personal-workload-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          Workload priority
        </p>
        <h2
          id="personal-workload-title"
          className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
        >
          Open follow-ups and tasks
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Overdue work is derived from due date and open state.
        </p>
      </div>

      <div className="mt-5 grid gap-3">
        <WorkloadCard
          label="Open follow-ups"
          value={workload.openFollowUps}
          detail={`${workload.overdueFollowUps} overdue`}
          tone={workload.overdueFollowUps > 0 ? "urgent" : "steady"}
        />
        <WorkloadCard
          label="Open tasks"
          value={workload.openTasks}
          detail={`${workload.overdueTasks} overdue`}
          tone={workload.overdueTasks > 0 ? "urgent" : "steady"}
        />
      </div>

      <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="text-sm font-semibold text-slate-900">
          {workload.totalOverdueWork > 0
            ? "Prioritize overdue work first"
            : "No overdue work currently"}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {workload.totalOverdueWork > 0
            ? `${workload.totalOverdueWork} overdue item${workload.totalOverdueWork === 1 ? "" : "s"} need attention across follow-ups and tasks.`
            : `You have ${workload.totalOpenWork} open follow-up or task item${workload.totalOpenWork === 1 ? "" : "s"}, with none overdue.`}
        </p>
      </div>
    </section>
  );
}

function WorkloadCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  tone: "urgent" | "steady";
}) {
  return (
    <article
      className={`rounded-xl border p-4 ${
        tone === "urgent"
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          tone === "urgent" ? "text-rose-600" : "text-slate-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function PerformanceState({
  title,
  description,
  tone,
}: {
  title: string;
  description: string;
  tone: "empty" | "warning";
}) {
  return (
    <section
      className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm shadow-slate-200/60"
      role="status"
    >
      <span
        aria-hidden="true"
        className={`mx-auto grid size-11 place-items-center rounded-full text-sm font-bold ${
          tone === "warning"
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {tone === "warning" ? "!" : "0"}
      </span>
      <h2 className="mt-4 text-sm font-semibold text-slate-800">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </section>
  );
}

