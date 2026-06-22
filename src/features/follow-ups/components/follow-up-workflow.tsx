"use client";

import { useMemo, useState } from "react";
import { FollowUpList } from "@/features/follow-ups/components/follow-up-list";
import { FollowUpSummary } from "@/features/follow-ups/components/follow-up-summary";
import type {
  FollowUpPageContext,
  FollowUpRecord,
  FollowUpStatus,
} from "@/features/follow-ups/types";

interface FollowUpWorkflowProps {
  context: FollowUpPageContext;
  followUps: FollowUpRecord[];
}

type FollowUpFilter = "all" | FollowUpStatus;

const filters: { label: string; value: FollowUpFilter }[] = [
  { label: "All", value: "all" },
  { label: "Overdue", value: "overdue" },
  { label: "Due today", value: "due_today" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export function FollowUpWorkflow({
  context,
  followUps,
}: FollowUpWorkflowProps) {
  const [activeFilter, setActiveFilter] = useState<FollowUpFilter>("all");
  const [successMessage, setSuccessMessage] = useState("");

  const visibleFollowUps = useMemo(
    () =>
      activeFilter === "all"
        ? followUps
        : followUps.filter((followUp) => followUp.status === activeFilter),
    [activeFilter, followUps],
  );

  const summaryCounts = useMemo<Record<FollowUpStatus, number>>(
    () => ({
      overdue: followUps.filter((followUp) => followUp.status === "overdue").length,
      due_today: followUps.filter((followUp) => followUp.status === "due_today").length,
      upcoming: followUps.filter((followUp) => followUp.status === "upcoming").length,
      cancelled: followUps.filter((followUp) => followUp.status === "cancelled").length,
      completed: followUps.filter((followUp) => followUp.status === "completed").length,
    }),
    [followUps],
  );

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

      <FollowUpSummary counts={summaryCounts} />

      <div className="flex flex-wrap gap-2" aria-label="Filter follow-ups by status">
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

      <FollowUpList
        role={context.role}
        followUps={visibleFollowUps}
        hasAuthorizedFollowUps={followUps.length > 0}
        onFollowUpCompleted={() =>
          setSuccessMessage(
            "Follow-up completed. The live queue and completion details have been refreshed.",
          )
        }
      />
    </div>
  );
}
