import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import type {
  TeamPerformanceData,
  TeamPerformanceExecutive,
  TeamPerformancePageContext,
  TeamPerformanceResult,
  TeamPerformanceSummary,
} from "@/features/team-performance/types";

interface TeamPerformanceWorkspaceProps {
  context: TeamPerformancePageContext;
  displayName: string;
  result: TeamPerformanceResult;
}

export function TeamPerformanceWorkspace({
  context,
  displayName,
  result,
}: TeamPerformanceWorkspaceProps) {
  const periodLabel =
    result.status === "ready" ? result.data.periodLabel : result.periodLabel;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <AppSidebar
        role={context.role}
        displayName={displayName}
        activeItem="team-performance"
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
                  Manager-only view
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Team Performance Workspace
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                A focused view of weekly visit execution, overdue work, customer
                coverage, and at-risk account load across your authorized sales team.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 sm:text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Reporting period
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-700">
                {periodLabel}
              </p>
            </div>
          </header>

          {result.status === "unavailable" ? (
            <TeamPerformanceState
              title="Team performance is temporarily unavailable"
              description="We could not load the authorized team metrics right now. Please refresh the page or try again shortly."
              tone="warning"
            />
          ) : result.data.executives.length === 0 ? (
            <TeamPerformanceState
              title="No Sales Executives found"
              description="This team does not currently have active Sales Executive profiles to summarize."
              tone="empty"
            />
          ) : (
            <TeamPerformanceContent data={result.data} />
          )}
        </div>
      </main>
    </div>
  );
}

export function TeamPerformanceAccessDenied({
  context,
  displayName,
}: {
  context: TeamPerformancePageContext;
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
            Manager workspace required
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Team Performance contains team-level metrics and is available only to
            authenticated Managers. Your personal workspace remains available from
            the sidebar.
          </p>
        </section>
      </main>
    </div>
  );
}

function TeamPerformanceContent({ data }: { data: TeamPerformanceData }) {
  return (
    <div className="mt-6 space-y-6">
      <section aria-labelledby="team-summary-title">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
            Team summary
          </p>
          <h2
            id="team-summary-title"
            className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
          >
            Current-week execution health
          </h2>
        </div>
        <SummaryGrid summary={data.summary} />
      </section>

      <section
        aria-labelledby="executive-performance-title"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
      >
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
              Executive performance
            </p>
            <h2
              id="executive-performance-title"
              className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
            >
              Authorized Sales Executive metrics
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Aggregate metrics only. Customer notes, completion notes, and raw
              record identifiers stay out of this manager view.
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {data.executives.length}{" "}
            {data.executives.length === 1 ? "executive" : "executives"}
          </span>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {data.executives.map((executive) => (
            <ExecutiveCard key={executive.id} executive={executive} />
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-1 border-t border-slate-200 py-2 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>FieldFlow AI team performance</p>
        <p>Metrics are scoped to the authenticated Manager&apos;s team.</p>
      </footer>
    </div>
  );
}

function SummaryGrid({ summary }: { summary: TeamPerformanceSummary }) {
  const cards = [
    {
      label: "Active Sales Executives",
      value: summary.activeExecutiveCount.toLocaleString(),
      detail: "Profiles on this authorized team",
    },
    {
      label: "Planned Visits",
      value: summary.plannedVisits.toLocaleString(),
      detail: "Current week, cancelled plans excluded",
    },
    {
      label: "Completed Visits",
      value: summary.completedVisits.toLocaleString(),
      detail: "Recorded completed visits this week",
    },
    {
      label: "Team Completion Rate",
      value: `${summary.completionRate}%`,
      detail: "Completed visits divided by planned visits",
    },
    {
      label: "Overdue Open Work",
      value: summary.overdueOpenWork.toLocaleString(),
      detail: "Open follow-ups and tasks before today",
    },
    {
      label: "At-risk Customers",
      value: summary.atRiskCustomers.toLocaleString(),
      detail: "Assigned accounts marked at risk",
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

function ExecutiveCard({
  executive,
}: {
  executive: TeamPerformanceExecutive;
}) {
  const territoryLabel =
    executive.territories.length > 0
      ? executive.territories.join(", ")
      : "No assigned territory";

  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight text-slate-950">
            {executive.name}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {territoryLabel}
          </p>
        </div>
        <span className="w-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          {executive.completionRate}% complete
        </span>
      </div>

      <div
        aria-hidden="true"
        className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${Math.min(executive.completionRate, 100)}%` }}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
        <Metric label="Customers" value={executive.assignedCustomerCount} />
        <Metric label="Planned" value={executive.plannedVisits} />
        <Metric label="Completed" value={executive.completedVisits} />
        <Metric label="Overdue follow-ups" value={executive.overdueFollowUps} />
        <Metric label="Overdue tasks" value={executive.overdueTasks} />
        <Metric label="At-risk" value={executive.atRiskCustomers} />
      </dl>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950">
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function TeamPerformanceState({
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
