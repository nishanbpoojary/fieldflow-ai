import type {
  CustomerFollowUpStatus,
  CustomerPriority,
  CustomerStatus,
  VisitHistoryStatus,
} from "@/features/customers/types";

const customerStatusStyles: Record<CustomerStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  New: "bg-blue-50 text-blue-700",
  "Follow-up needed": "bg-rose-50 text-rose-700",
  Dormant: "bg-slate-100 text-slate-600",
};

const priorityStyles: Record<CustomerPriority, string> = {
  High: "bg-rose-50 text-rose-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

const visitStatusStyles: Record<VisitHistoryStatus, string> = {
  Completed: "bg-emerald-50 text-emerald-700",
  Missed: "bg-rose-50 text-rose-700",
  Cancelled: "bg-slate-100 text-slate-600",
};

const followUpStatusStyles: Record<CustomerFollowUpStatus, string> = {
  Open: "bg-blue-50 text-blue-700",
  Overdue: "bg-rose-50 text-rose-700",
};

const badgeBase = "inline-flex w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold";

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <span className={`${badgeBase} ${customerStatusStyles[status]}`}>{status}</span>;
}

export function CustomerPriorityBadge({ priority }: { priority: CustomerPriority }) {
  return <span className={`${badgeBase} ${priorityStyles[priority]}`}>{priority} priority</span>;
}

export function VisitStatusBadge({ status }: { status: VisitHistoryStatus }) {
  return <span className={`${badgeBase} ${visitStatusStyles[status]}`}>{status}</span>;
}

export function FollowUpStatusBadge({ status }: { status: CustomerFollowUpStatus }) {
  return <span className={`${badgeBase} ${followUpStatusStyles[status]}`}>{status}</span>;
}
