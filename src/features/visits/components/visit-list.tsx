import type { AppRole } from "@/features/dashboard/types";
import type {
  VisitPriority,
  VisitRecord,
  VisitStatus,
} from "@/features/visits/types";

interface VisitListProps {
  role: AppRole;
  visits: VisitRecord[];
  hasAuthorizedVisits: boolean;
}

const statusStyles: Record<VisitStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  missed: "bg-rose-50 text-rose-700 ring-rose-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const priorityStyles: Record<VisitPriority, string> = {
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

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
}

export function VisitList({
  role,
  visits,
  hasAuthorizedVisits,
}: VisitListProps) {
  return (
    <section
      aria-labelledby="visit-schedule-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
        Authorized schedule
      </p>
      <h2 id="visit-schedule-title" className="mt-1 text-lg font-semibold text-slate-950">
        {role === "manager" ? "Team visit schedule" : "My visit schedule"}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {role === "manager"
          ? "Review database-backed team activity across authorized territories."
          : "Review your database-backed assigned plans and recorded outcomes."}
      </p>

      {visits.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {visits.map((visit) => (
            <li key={visit.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
              <article>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold text-slate-950">{visit.customerName}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {visit.territory} · {visit.assignedSalesExecutive}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[visit.status]}`}
                    >
                      {visit.status}
                    </span>
                    <span className={`px-1 py-1 text-xs font-semibold capitalize ${priorityStyles[visit.priority]}`}>
                      {visit.priority} priority
                    </span>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Date</dt>
                    <dd className="mt-1 font-medium text-slate-700">{formatDate(visit.scheduledDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Time</dt>
                    <dd className="mt-1 font-medium text-slate-700">{formatTime(visit.scheduledTime)}</dd>
                  </div>
                </dl>

                {visit.planningNote ? (
                  <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                    <span className="font-semibold text-slate-700">Planning note:</span> {visit.planningNote}
                  </p>
                ) : null}

                {visit.status === "completed" && visit.outcome ? (
                  <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-3 text-sm leading-6 text-slate-600">
                    <p><span className="font-semibold text-slate-700">Outcome:</span> {visit.outcome}</p>
                    {visit.notes ? <p><span className="font-semibold text-slate-700">Notes:</span> {visit.notes}</p> : null}
                  </div>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {hasAuthorizedVisits ? "No visits match this filter" : "No authorized visits yet"}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {hasAuthorizedVisits
              ? "Choose another status to return to the visit schedule."
              : "Visit plans will appear here when records are assigned within your authorized scope."}
          </p>
        </div>
      )}
    </section>
  );
}
