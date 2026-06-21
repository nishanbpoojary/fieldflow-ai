"use client";

import { useMemo, useState } from "react";
import { VisitList } from "@/features/visits/components/visit-list";
import { VisitPlanningForm } from "@/features/visits/components/visit-planning-form";
import { VisitSummary } from "@/features/visits/components/visit-summary";
import type {
  DemoVisit,
  NewVisitInput,
  VisitCompletionInput,
  VisitCustomerOption,
  VisitPageContext,
} from "@/features/visits/types";

interface VisitWorkflowProps {
  context: VisitPageContext;
  initialVisits: DemoVisit[];
  customers: VisitCustomerOption[];
  salesExecutives: readonly string[];
  demoToday: string;
}

export function VisitWorkflow({
  context,
  initialVisits,
  customers,
  salesExecutives,
  demoToday,
}: VisitWorkflowProps) {
  const [visits, setVisits] = useState<DemoVisit[]>(initialVisits);
  const [completionVisitId, setCompletionVisitId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const visibleVisits = useMemo(() => {
    const roleVisits =
      context.role === "sales_executive"
        ? visits.filter((visit) => visit.assignedSalesExecutive === "Maya Chen")
        : visits;

    return [...roleVisits].sort((first, second) =>
      `${first.scheduledDate}-${first.scheduledTime}`.localeCompare(
        `${second.scheduledDate}-${second.scheduledTime}`,
      ),
    );
  }, [context.role, visits]);

  const summaryItems = useMemo(() => {
    if (context.role === "manager") {
      return [
        { label: "Pending", value: String(visibleVisits.filter((visit) => visit.status === "pending").length), detail: "Visits awaiting completion", tone: "blue" as const },
        { label: "Completed", value: String(visibleVisits.filter((visit) => visit.status === "completed").length), detail: "Recorded team outcomes", tone: "emerald" as const },
        { label: "Missed", value: String(visibleVisits.filter((visit) => visit.status === "missed").length), detail: "Visits needing attention", tone: "rose" as const },
        { label: "Cancelled", value: String(visibleVisits.filter((visit) => visit.status === "cancelled").length), detail: "Removed from active plans", tone: "slate" as const },
      ];
    }

    const todaysVisits = visibleVisits.filter((visit) => visit.scheduledDate === demoToday);
    const completedToday = todaysVisits.filter((visit) => visit.status === "completed").length;
    const completionRate = todaysVisits.length > 0 ? Math.round((completedToday / todaysVisits.length) * 100) : 0;

    return [
      { label: "Today's visits", value: String(todaysVisits.length), detail: "Maya Chen's demo schedule", tone: "blue" as const },
      { label: "Pending", value: String(visibleVisits.filter((visit) => visit.status === "pending").length), detail: "Available to complete", tone: "slate" as const },
      { label: "Completed today", value: String(completedToday), detail: "Outcomes recorded", tone: "emerald" as const },
      { label: "Completion rate", value: `${completionRate}%`, detail: "Completed visits today", tone: "blue" as const },
    ];
  }, [context.role, demoToday, visibleVisits]);

  function handlePlan(input: NewVisitInput) {
    const customer = customers.find((option) => option.id === input.customerId);
    if (!customer) {
      return;
    }

    const visit: DemoVisit = {
      id: `session-visit-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.companyName,
      territory: customer.territory,
      assignedSalesExecutive: input.assignedSalesExecutive,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      status: "pending",
      priority: input.priority,
      planningNote: input.planningNote,
    };

    setVisits((currentVisits) => [...currentVisits, visit]);
    setCompletionVisitId(null);
    setSuccessMessage(`Visit planned for ${customer.companyName}.`);
  }

  function handleComplete(visitId: string, input: VisitCompletionInput) {
    const visit = visits.find((candidate) => candidate.id === visitId);
    if (
      context.role !== "sales_executive" ||
      !visit ||
      visit.assignedSalesExecutive !== "Maya Chen" ||
      visit.status !== "pending"
    ) {
      return;
    }

    setVisits((currentVisits) =>
      currentVisits.map((candidate) =>
        candidate.id === visitId
          ? { ...candidate, status: "completed", outcome: input.outcome, notes: input.notes }
          : candidate,
      ),
    );
    setCompletionVisitId(null);
    setSuccessMessage(`Visit for ${visit.customerName} marked complete.`);
  }

  return (
    <div className="space-y-6">
      {successMessage ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <VisitSummary items={summaryItems} />

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.25fr)] xl:items-start">
        <VisitPlanningForm
          role={context.role}
          customers={customers}
          salesExecutives={salesExecutives}
          defaultDate={demoToday}
          onPlan={handlePlan}
        />
        <VisitList
          role={context.role}
          visits={visibleVisits}
          completionVisitId={completionVisitId}
          onStartCompletion={(visitId) => {
            setCompletionVisitId(visitId);
            setSuccessMessage("");
          }}
          onCancelCompletion={() => setCompletionVisitId(null)}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
