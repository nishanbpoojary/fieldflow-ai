import { AppSidebar } from "@/features/dashboard/components/app-sidebar";
import { CreateTaskAction } from "@/features/tasks/components/create-task-action";
import { TaskWorkflow } from "@/features/tasks/components/task-workflow";
import type {
  TaskPageContext,
  TaskWorkspaceResult,
} from "@/features/tasks/types";

interface TaskPageShellProps {
  context: TaskPageContext;
  displayName: string;
  jobTitle?: string | null;
  result: TaskWorkspaceResult;
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

export function TaskPageShell({
  context,
  displayName,
  jobTitle,
  result,
}: TaskPageShellProps) {
  const isManager = context.role === "manager";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <AppSidebar
        role={context.role}
        displayName={displayName}
        jobTitle={jobTitle}
        activeItem="tasks"
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
                {isManager ? "Team Tasks Workspace" : "My Tasks Workspace"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {isManager
                  ? "An authorized team-level view of tasks across your customers and territories."
                  : `An authorized personal view of tasks assigned to ${displayName}.`}
              </p>
            </div>
            <p className="text-sm font-medium text-slate-600">
              {formatOverviewDate(result.today)}
            </p>
          </header>

          {result.status === "ready" ? (
            <div className="mt-6 space-y-6">
              <CreateTaskAction
                isManager={isManager}
                options={result.creationOptions}
                defaultDate={result.today}
              />
              <TaskWorkflow context={context} tasks={result.tasks} />
            </div>
          ) : (
            <section
              className="rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm shadow-slate-200/60"
              role="status"
            >
              <p className="text-sm font-semibold text-slate-900">
                Task data is temporarily unavailable
              </p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                We could not load the authorized task queue right now. Please
                try again shortly.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
