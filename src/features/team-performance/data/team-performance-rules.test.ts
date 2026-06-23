import { describe, expect, it } from "vitest";

import {
  buildTeamPerformanceData,
  calculateCompletionRate,
} from "@/features/team-performance/data/team-performance-rules";

const baseInput = {
  today: "2026-06-23",
  weekStart: "2026-06-22",
  weekEnd: "2026-06-28",
  periodLabel: "Week of Jun 22-Jun 28, 2026",
  executives: [
    { id: "exec-1", name: "Maya Chen" },
    { id: "exec-2", name: "Dev Patel" },
  ],
  territories: [
    { id: "territory-1", name: "Mangaluru Central" },
    { id: "territory-2", name: "Puttur" },
  ],
  customers: [
    {
      id: "customer-1",
      territoryId: "territory-1",
      assignedSalesExecutiveId: "exec-1",
      status: "at_risk" as const,
    },
    {
      id: "customer-2",
      territoryId: "territory-1",
      assignedSalesExecutiveId: "exec-1",
      status: "active" as const,
    },
    {
      id: "customer-3",
      territoryId: "territory-2",
      assignedSalesExecutiveId: "exec-2",
      status: "at_risk" as const,
    },
  ],
  visitPlans: [
    {
      assignedSalesExecutiveId: "exec-1",
      scheduledDate: "2026-06-23",
      status: "pending" as const,
    },
    {
      assignedSalesExecutiveId: "exec-1",
      scheduledDate: "2026-06-24",
      status: "completed" as const,
    },
    {
      assignedSalesExecutiveId: "exec-2",
      scheduledDate: "2026-06-25",
      status: "cancelled" as const,
    },
  ],
  visits: [
    {
      assignedSalesExecutiveId: "exec-1",
      completedDate: "2026-06-23",
    },
    {
      assignedSalesExecutiveId: "exec-2",
      completedDate: "2026-06-21",
    },
  ],
  followUps: [
    {
      assignedSalesExecutiveId: "exec-1",
      dueDate: "2026-06-21",
      state: "open" as const,
    },
    {
      assignedSalesExecutiveId: "exec-1",
      dueDate: "2026-06-20",
      state: "completed" as const,
    },
  ],
  tasks: [
    {
      assignedSalesExecutiveId: "exec-2",
      dueDate: "2026-06-22",
      state: "open" as const,
    },
  ],
};

describe("team performance rules", () => {
  it("calculates completion rate from completed and planned visits", () => {
    expect(calculateCompletionRate(3, 4)).toBe(75);
  });

  it("returns 0 completion when there are no planned visits", () => {
    expect(calculateCompletionRate(2, 0)).toBe(0);
  });

  it("aggregates planned and completed visit totals for the current week", () => {
    const result = buildTeamPerformanceData(baseInput);

    expect(result.summary.plannedVisits).toBe(2);
    expect(result.summary.completedVisits).toBe(1);
    expect(result.summary.completionRate).toBe(50);
  });

  it("aggregates overdue open follow-ups and tasks without completed work", () => {
    const result = buildTeamPerformanceData(baseInput);

    expect(result.summary.overdueOpenWork).toBe(2);
    expect(result.executives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "exec-1",
          overdueFollowUps: 1,
          overdueTasks: 0,
          overdueOpenWork: 1,
        }),
        expect.objectContaining({
          id: "exec-2",
          overdueFollowUps: 0,
          overdueTasks: 1,
          overdueOpenWork: 1,
        }),
      ]),
    );
  });

  it("aggregates at-risk assigned customers by executive and team", () => {
    const result = buildTeamPerformanceData(baseInput);

    expect(result.summary.atRiskCustomers).toBe(2);
    expect(result.executives).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "exec-1",
          assignedCustomerCount: 2,
          atRiskCustomers: 1,
          territories: ["Mangaluru Central"],
        }),
        expect.objectContaining({
          id: "exec-2",
          assignedCustomerCount: 1,
          atRiskCustomers: 1,
          territories: ["Puttur"],
        }),
      ]),
    );
  });
});

