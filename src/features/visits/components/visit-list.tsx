import type { FormEvent } from "react";
import type { AppRole } from "@/features/dashboard/types";
import type {
  DemoVisit,
  VisitCompletionInput,
  VisitPriority,
  VisitStatus,
} from "@/features/visits/types";

interface VisitListProps {
  role: AppRole;
  visits: DemoVisit[];
  completionVisitId: string | null;
  onStartCompletion: (visitId: string) => void;
  onCancelCompletion: () => void;
  onComplete: (visitId: string, input: VisitCompletionInput) => void;
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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2026, 0, 1, hours, minutes));
}

function getFormValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

interface CompletionFormProps {
  visit: DemoVisit;
  onCancel: () => void;
  onComplete: (visitId: string, input: VisitCompletionInput) => void;
}

function CompletionForm({ visit, onCancel, onComplete }: CompletionFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const outcome = getFormValue(formData, "outcome");
    const notes = getFormValue(formData, "notes");

    if (!outcome || !notes) {
      return;
    }

    onComplete(visit.id, { outcome, notes });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 grid gap-4 rounded-xl border border-blue-200 bg-blue-50/60 p-4"
      aria-label={`Complete visit for ${visit.customerName}`}
    >
      <label className="text-sm font-medium text-slate-700">
        Visit outcome
        <select
          name="outcome"
          required
          defaultValue=""
          className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="" disabled>
            Select an outcome
          </option>
          <option value="Follow-up agreed">Follow-up agreed</option>
          <option value="Proposal requested">Proposal requested</option>
          <option value="Decision pending">Decision pending</option>
          <option value="No current opportunity">No current opportunity</option>
        </select>
      </label>

      <label className="text-sm font-medium text-slate-700">
        Completion notes
        <textarea
          name="notes"
          required
          rows={3}
          placeholder="Record what happened and the next useful context"
          className="mt-2 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Save completion
        </button>
      </div>
    </form>
  );
}

export function VisitList({
  role,
  visits,
  completionVisitId,
  onStartCompletion,
  onCancelCompletion,
  onComplete,
}: VisitListProps) {
  return (
    <section
      aria-labelledby="visit-schedule-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
        Live demo schedule
      </p>
      <h2 id="visit-schedule-title" className="mt-1 text-lg font-semibold text-slate-950">
        {role === "manager" ? "Team visit schedule" : "My visit schedule"}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">
        {role === "manager"
          ? "Review team activity across territories. Completion controls belong to the sales executive view."
          : "Maya Chen can complete her pending visits and record an outcome and notes."}
      </p>

      {visits.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {visits.map((visit) => {
            const canComplete = role === "sales_executive" && visit.status === "pending";
            const isCompleting = completionVisitId === visit.id;

            return (
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

                  {visit.status === "completed" && visit.outcome && visit.notes ? (
                    <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-3 text-sm leading-6 text-slate-600">
                      <p><span className="font-semibold text-slate-700">Outcome:</span> {visit.outcome}</p>
                      <p><span className="font-semibold text-slate-700">Notes:</span> {visit.notes}</p>
                    </div>
                  ) : null}

                  {canComplete && !isCompleting ? (
                    <button
                      type="button"
                      onClick={() => onStartCompletion(visit.id)}
                      className="mt-4 min-h-11 w-full rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
                    >
                      Complete visit
                    </button>
                  ) : null}

                  {isCompleting ? (
                    <CompletionForm visit={visit} onCancel={onCancelCompletion} onComplete={onComplete} />
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">No visits scheduled</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Use the planner to add a synthetic visit for this session.</p>
        </div>
      )}
    </section>
  );
}
