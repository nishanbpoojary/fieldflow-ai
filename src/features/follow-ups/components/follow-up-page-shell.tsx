import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { CreateFollowUpAction } from "@/features/follow-ups/components/create-follow-up-action";
import { FollowUpWorkflow } from "@/features/follow-ups/components/follow-up-workflow";
import type {
  FollowUpPageContext,
  FollowUpWorkspaceResult,
} from "@/features/follow-ups/types";

interface FollowUpPageShellProps {
  context: FollowUpPageContext;
  displayName: string;
  jobTitle?: string | null;
  result: FollowUpWorkspaceResult;
}

function formatOverviewDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function FollowUpPageShell({
  context,
  displayName,
  jobTitle,
  result,
}: FollowUpPageShellProps) {
  const isManager = context.role === "manager";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <AppSidebar
        role={context.role}
        displayName={displayName}
        jobTitle={jobTitle}
        activeItem="follow-ups"
        isOrganizationAdmin={context.isOrganizationAdmin}
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
                  {context.roleLabel} view
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                {isManager ? "Team Follow-ups Workspace" : "My Follow-ups Workspace"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {isManager
                  ? "An authorized team-level view of customer commitments across your territories."
                  : `An authorized personal view of follow-ups assigned to ${displayName}.`}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {formatOverviewDate(result.today)}
            </p>
          </header>

          {result.status === "ready" ? (
            <div className="mt-6 space-y-6">
              <CreateFollowUpAction
                isManager={isManager}
                options={result.creationOptions}
                defaultDate={result.today}
              />
              <FollowUpWorkflow
                context={context}
                followUps={result.followUps}
              />
            </div>
          ) : (
            <section
              className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60"
              role="status"
            >
              <p className="text-sm font-semibold text-slate-900">
                Follow-up data is temporarily unavailable
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                We could not load the authorized follow-up queue right now. Please try again shortly.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
