import type { FollowUpStatus } from "@/features/follow-ups/types";

interface FollowUpSummaryProps {
  counts: Record<FollowUpStatus, number>;
}

const summaryItems: Array<{
  status: FollowUpStatus;
  label: string;
  detail: string;
  tone: string;
}> = [
  {
    status: "overdue",
    label: "Overdue",
    detail: "Needs immediate attention",
    tone: "border-t-rose-500 text-rose-950",
  },
  {
    status: "due_today",
    label: "Due today",
    detail: "Scheduled for today",
    tone: "border-t-amber-500 text-amber-950",
  },
  {
    status: "upcoming",
    label: "Upcoming",
    detail: "Planned for later",
    tone: "border-t-blue-500 text-blue-950",
  },
  {
    status: "completed",
    label: "Completed",
    detail: "Completion notes recorded",
    tone: "border-t-emerald-500 text-emerald-950",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    detail: "Removed from active work",
    tone: "border-t-slate-400 text-slate-900",
  },
];

export function FollowUpSummary({ counts }: FollowUpSummaryProps) {
  return (
    <section
      aria-label="Follow-up summary"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      {summaryItems.map((item) => (
        <article
          key={item.status}
          className={`rounded-2xl border border-t-4 border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 ${item.tone}`}
        >
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {counts[item.status]}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
