"use client";

import { useMemo, useState } from "react";
import { FollowUpForm } from "@/features/follow-ups/components/follow-up-form";
import { FollowUpList } from "@/features/follow-ups/components/follow-up-list";
import { FollowUpSummary } from "@/features/follow-ups/components/follow-up-summary";
import type {
  DemoFollowUp,
  FollowUpCustomerOption,
  FollowUpPageContext,
  FollowUpStatus,
  NewFollowUpInput,
} from "@/features/follow-ups/types";

interface FollowUpWorkflowProps {
  context: FollowUpPageContext;
  initialFollowUps: DemoFollowUp[];
  customers: FollowUpCustomerOption[];
  demoToday: string;
}

const statusOrder: Record<FollowUpStatus, number> = {
  overdue: 0,
  due_today: 1,
  upcoming: 2,
  completed: 3,
};

function getStatusForDueDate(dueDate: string, demoToday: string): FollowUpStatus {
  if (dueDate < demoToday) {
    return "overdue";
  }

  return dueDate === demoToday ? "due_today" : "upcoming";
}

export function FollowUpWorkflow({
  context,
  initialFollowUps,
  customers,
  demoToday,
}: FollowUpWorkflowProps) {
  const [followUps, setFollowUps] =
    useState<DemoFollowUp[]>(initialFollowUps);
  const [completionId, setCompletionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const visibleFollowUps = useMemo(() => {
    const roleFollowUps =
      context.role === "sales_executive"
        ? followUps.filter(
            (followUp) => followUp.assignedSalesExecutive === "Maya Chen",
          )
        : followUps;

    return [...roleFollowUps].sort((first, second) => {
      const statusComparison =
        statusOrder[first.status] - statusOrder[second.status];

      return statusComparison || first.dueDate.localeCompare(second.dueDate);
    });
  }, [context.role, followUps]);

  const summaryCounts = useMemo<Record<FollowUpStatus, number>>(
    () => ({
      overdue: visibleFollowUps.filter(
        (followUp) => followUp.status === "overdue",
      ).length,
      due_today: visibleFollowUps.filter(
        (followUp) => followUp.status === "due_today",
      ).length,
      upcoming: visibleFollowUps.filter(
        (followUp) => followUp.status === "upcoming",
      ).length,
      completed: visibleFollowUps.filter(
        (followUp) => followUp.status === "completed",
      ).length,
    }),
    [visibleFollowUps],
  );

  function handleCreate(input: NewFollowUpInput) {
    if (context.role !== "sales_executive") {
      return;
    }

    const customer = customers.find(
      (option) =>
        option.id === input.customerId &&
        option.assignedSalesExecutive === "Maya Chen",
    );

    if (!customer) {
      return;
    }

    const followUp: DemoFollowUp = {
      id: `session-follow-up-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.companyName,
      territory: customer.territory,
      assignedSalesExecutive: "Maya Chen",
      title: input.title,
      dueDate: input.dueDate,
      status: getStatusForDueDate(input.dueDate, demoToday),
      priority: input.priority,
      planningNote: input.planningNote,
    };

    setFollowUps((currentFollowUps) => [...currentFollowUps, followUp]);
    setCompletionId(null);
    setSuccessMessage(`Follow-up created for ${customer.companyName}.`);
  }

  function handleComplete(followUpId: string, completionNote: string) {
    const followUp = followUps.find(
      (candidate) => candidate.id === followUpId,
    );

    if (
      context.role !== "sales_executive" ||
      !followUp ||
      followUp.assignedSalesExecutive !== "Maya Chen" ||
      followUp.status === "completed" ||
      !completionNote.trim()
    ) {
      return;
    }

    setFollowUps((currentFollowUps) =>
      currentFollowUps.map((candidate) =>
        candidate.id === followUpId
          ? {
              ...candidate,
              status: "completed",
              completionNote: completionNote.trim(),
              completedDate: demoToday,
            }
          : candidate,
      ),
    );
    setCompletionId(null);
    setSuccessMessage(
      `Follow-up for ${followUp.customerName} marked complete.`,
    );
  }

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

      <div
        className={
          context.role === "sales_executive"
            ? "grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)] xl:items-start"
            : "min-w-0"
        }
      >
        {context.role === "sales_executive" ? (
          <FollowUpForm
            customers={customers}
            defaultDate={demoToday}
            onCreate={handleCreate}
          />
        ) : null}
        <FollowUpList
          role={context.role}
          followUps={visibleFollowUps}
          completionId={completionId}
          onStartCompletion={(followUpId) => {
            setCompletionId(followUpId);
            setSuccessMessage("");
          }}
          onCancelCompletion={() => setCompletionId(null)}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
