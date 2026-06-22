"use client";

import { useMemo, useState } from "react";
import { VisitList } from "@/features/visits/components/visit-list";
import { VisitSummary } from "@/features/visits/components/visit-summary";
import type {
  VisitPageContext,
  VisitRecord,
  VisitStatus,
} from "@/features/visits/types";

interface VisitWorkflowProps {
  context: VisitPageContext;
  visits: VisitRecord[];
  today: string;
}

type VisitFilter = "all" | VisitStatus;

const filters: { label: string; value: VisitFilter }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Missed", value: "missed" },
  { label: "Cancelled", value: "cancelled" },
];

export function VisitWorkflow({
  context,
  visits,
  today,
}: VisitWorkflowProps) {
  const [activeFilter, setActiveFilter] = useState<VisitFilter>("all");
  const [successMessage, setSuccessMessage] = useState("");

  const visibleVisits = useMemo(
    () =>
      activeFilter === "all"
        ? visits
        : visits.filter((visit) => visit.status === activeFilter),
    [activeFilter, visits],
  );

  const summaryItems = useMemo(() => {
    if (context.role === "manager") {
      return [
        { label: "Pending", value: String(visits.filter((visit) => visit.status === "pending").length), detail: "Visits awaiting completion", tone: "blue" as const },
        { label: "Completed", value: String(visits.filter((visit) => visit.status === "completed").length), detail: "Recorded team outcomes", tone: "emerald" as const },
        { label: "Missed", value: String(visits.filter((visit) => visit.status === "missed").length), detail: "Visits needing attention", tone: "rose" as const },
        { label: "Cancelled", value: String(visits.filter((visit) => visit.status === "cancelled").length), detail: "Removed from active plans", tone: "slate" as const },
      ];
    }

    const todaysVisits = visits.filter((visit) => visit.scheduledDate === today);
    const completedToday = todaysVisits.filter(
      (visit) => visit.status === "completed",
    ).length;
    const completionRate =
      todaysVisits.length > 0
        ? Math.round((completedToday / todaysVisits.length) * 100)
        : 0;

    return [
      { label: "Today's visits", value: String(todaysVisits.length), detail: "Your authorized schedule", tone: "blue" as const },
      { label: "Pending", value: String(visits.filter((visit) => visit.status === "pending").length), detail: "Awaiting completion", tone: "slate" as const },
      { label: "Completed today", value: String(completedToday), detail: "Outcomes recorded", tone: "emerald" as const },
      { label: "Completion rate", value: `${completionRate}%`, detail: "Completed visits today", tone: "blue" as const },
    ];
  }, [context.role, today, visits]);

  return (
    <div className="space-y-6">
      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
        >
          {successMessage}
        </div>
      ) : null}

      <VisitSummary items={summaryItems} />

      <div className="flex flex-wrap gap-2" aria-label="Filter visits by status">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            aria-pressed={activeFilter === filter.value}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              activeFilter === filter.value
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <VisitList
        role={context.role}
        visits={visibleVisits}
        hasAuthorizedVisits={visits.length > 0}
        onVisitCompleted={() =>
          setSuccessMessage(
            "Visit completed. The live schedule and outcome details have been refreshed.",
          )
        }
      />
    </div>
  );
}
