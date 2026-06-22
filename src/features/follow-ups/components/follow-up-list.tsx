import type { AppRole } from "@/features/dashboard/types";
import type {
  FollowUpPriority,
  FollowUpRecord,
  FollowUpStatus,
} from "@/features/follow-ups/types";

interface FollowUpListProps {
  role: AppRole;
  followUps: FollowUpRecord[];
  hasAuthorizedFollowUps: boolean;
}

const statusGroups: Array<{ status: FollowUpStatus; label: string }> = [
  { status: "overdue", label: "Overdue" },
  { status: "due_today", label: "Due today" },
  { status: "upcoming", label: "Upcoming" },
  { status: "completed", label: "Completed" },
  { status: "cancelled", label: "Cancelled" },
];

const statusStyles: Record<FollowUpStatus, string> = {
  overdue: "bg-rose-50 text-rose-700 ring-rose-600/20",
  due_today: "bg-amber-50 text-amber-700 ring-amber-600/20",
  upcoming: "bg-blue-50 text-blue-700 ring-blue-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

const priorityStyles: Record<FollowUpPriority, string> = {
  high: "text-rose-700",
  medium: "text-amber-700",
  low: "text-slate-500",
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatCompletedAt(timestamp: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(timestamp));
}

export function FollowUpList({
  role,
  followUps,
  hasAuthorizedFollowUps,
}: FollowUpListProps) {
  return (
    <section
      aria-labelledby="follow-up-list-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
        Authorized status queue
      </p>
      <h2 id="follow-up-list-title" className="mt-1 text-lg font-semibold text-slate-950">
        {role === "manager" ? "Team follow-ups" : "My follow-ups"}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {role === "manager"
          ? "Review database-backed team commitments by urgency."
          : "Review your database-backed assigned commitments by urgency."}
      </p>

      {followUps.length > 0 ? (
        <div className="mt-6 space-y-7">
          {statusGroups.map((group) => {
            const groupedFollowUps = followUps.filter(
              (followUp) => followUp.status === group.status,
            );

            if (groupedFollowUps.length === 0) return null;

            return (
              <section key={group.status} aria-labelledby={`follow-up-group-${group.status}`}>
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
                  <h3
                    id={`follow-up-group-${group.status}`}
                    className="text-sm font-semibold text-slate-800"
                  >
                    {group.label}
                  </h3>
                  <span className="text-xs font-medium text-slate-400">
                    {groupedFollowUps.length}
                  </span>
                </div>

                <ul className="mt-3 space-y-3">
                  {groupedFollowUps.map((followUp) => (
                    <li key={followUp.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                      <article>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="break-words font-semibold text-slate-950">
                              {followUp.title}
                            </h4>
                            <p className="mt-1 break-words text-sm text-slate-600">
                              {followUp.customerName}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {followUp.territory} · {followUp.assignedSalesExecutive}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[followUp.status]}`}
                            >
                              {group.label}
                            </span>
                            <span className={`px-1 py-1 text-xs font-semibold capitalize ${priorityStyles[followUp.priority]}`}>
                              {followUp.priority} priority
                            </span>
                          </div>
                        </div>

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Due date</dt>
                            <dd className="mt-1 font-medium text-slate-700">{formatDate(followUp.dueDate)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">State</dt>
                            <dd className="mt-1 font-medium capitalize text-slate-700">{followUp.state}</dd>
                          </div>
                          {followUp.completedAt ? (
                            <div>
                              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Completed</dt>
                              <dd className="mt-1 font-medium text-slate-700">{formatCompletedAt(followUp.completedAt)}</dd>
                            </div>
                          ) : null}
                        </dl>

                        {followUp.planningNote ? (
                          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                            <span className="font-semibold text-slate-700">Planning note:</span>{" "}
                            {followUp.planningNote}
                          </p>
                        ) : null}

                        {followUp.state === "completed" && followUp.completionNote ? (
                          <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm leading-6 text-slate-600">
                            <span className="font-semibold text-slate-700">Completion note:</span>{" "}
                            {followUp.completionNote}
                          </p>
                        ) : null}
                      </article>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {hasAuthorizedFollowUps
              ? "No follow-ups match this filter"
              : "No authorized follow-ups yet"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {hasAuthorizedFollowUps
              ? "Choose another status to return to the follow-up queue."
              : "Follow-ups will appear here when records are assigned within your authorized scope."}
          </p>
        </div>
      )}
    </section>
  );
}
