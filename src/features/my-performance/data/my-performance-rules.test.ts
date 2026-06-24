import { describe, expect, it } from "vitest";

import {
  buildMyPerformanceData,
  calculatePersonalCompletionRate,
} from "@/features/my-performance/data/my-performance-rules";

const baseInput = {
  salesExecutiveId: "sales-1",
  today: "2026-06-24",
  weekStart: "2026-06-22",
  weekEnd: "2026-06-28",
  monthStart: "2026-06-01",
  monthEndExclusive: "2026-07-01",
  periodLabel: "1 Jun 2026 - 30 Jun 2026",
  territories: [
    { id: "territory-1", name: "Mangaluru Central" },
    { id: "territory-2", name: "Puttur" },
  ],
  customers: [
    {
      id: "customer-1",
      territoryId: "territory-1",
      assignedSalesExecutiveId: "sales-1",
      status: "active" as const,
    },
    {
      id: "customer-2",
      territoryId: "territory-1",
      assignedSalesExecutiveId: "sales-1",
      status: "at_risk" as const,
    },
    {
      id: "customer-3",
      territoryId: "territory-2",
      assignedSalesExecutiveId: "sales-1",
      status: "prospect" as const,
    },
    {
      id: "customer-other",
      territoryId: "territory-2",
      assignedSalesExecutiveId: "sales-2",
      status: "at_risk" as const,
    },
  ],
  visitPlans: [
    {
      assignedSalesExecutiveId: "sales-1",
      scheduledDate: "2026-06-24",
      status: "pending" as const,
    },
    {
      assignedSalesExecutiveId: "sales-1",
      scheduledDate: "2026-06-25",
      status: "completed" as const,
    },
    {
      assignedSalesExecutiveId: "sales-1",
      scheduledDate: "2026-06-26",
      status: "cancelled" as const,
    },
    {
      assignedSalesExecutiveId: "sales-2",
      scheduledDate: "2026-06-24",
      status: "pending" as const,
    },
  ],
  visits: [
    {
      assignedSalesExecutiveId: "sales-1",
      completedDate: "2026-06-24",
    },
    {
      assignedSalesExecutiveId: "sales-1",
      completedDate: "2026-06-25",
    },
    {
      assignedSalesExecutiveId: "sales-2",
      completedDate: "2026-06-24",
    },
  ],
  followUps: [
    {
      assignedSalesExecutiveId: "sales-1",
      dueDate: "2026-06-23",
      state: "open" as const,
    },
    {
      assignedSalesExecutiveId: "sales-1",
      dueDate: "2026-06-24",
      state: "open" as const,
    },
    {
      assignedSalesExecutiveId: "sales-2",
      dueDate: "2026-06-20",
      state: "open" as const,
    },
  ],
  tasks: [
    {
      assignedSalesExecutiveId: "sales-1",
      dueDate: "2026-06-22",
      state: "open" as const,
    },
    {
      assignedSalesExecutiveId: "sales-1",
      dueDate: "2026-06-24",
      state: "completed" as const,
    },
    {
      assignedSalesExecutiveId: "sales-2",
      dueDate: "2026-06-20",
      state: "open" as const,
    },
  ],
};

describe("my performance rules", () => {
  it("calculates current-month personal completion rate", () => {
    expect(calculatePersonalCompletionRate(3, 4)).toBe(75);
  });

  it("returns 0 completion when there are no planned visits", () => {
    expect(calculatePersonalCompletionRate(3, 0)).toBe(0);
  });

  it("aggregates current-month planned and completed visits", () => {
    const result = buildMyPerformanceData(baseInput);

    expect(result.summary.monthlyPlannedVisits).toBe(2);
    expect(result.summary.monthlyCompletedVisits).toBe(2);
    expect(result.summary.monthlyCompletionRate).toBe(100);
  });

  it("aggregates today's planned, completed, and pending visits", () => {
    const result = buildMyPerformanceData(baseInput);

    expect(result.summary.todaysPlannedVisits).toBe(1);
    expect(result.summary.todaysCompletedVisits).toBe(1);
    expect(result.summary.todaysPendingVisits).toBe(1);
    expect(result.dailyTrend).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          date: "2026-06-24",
          plannedVisits: 1,
          completedVisits: 1,
        }),
      ]),
    );
  });

  it("aggregates open and overdue personal work", () => {
    const result = buildMyPerformanceData(baseInput);

    expect(result.workload.openFollowUps).toBe(2);
    expect(result.workload.overdueFollowUps).toBe(1);
    expect(result.workload.openTasks).toBe(1);
    expect(result.workload.overdueTasks).toBe(1);
    expect(result.workload.totalOverdueWork).toBe(2);
  });

  it("aggregates at-risk assigned customers", () => {
    const result = buildMyPerformanceData(baseInput);

    expect(result.summary.assignedCustomerCount).toBe(3);
    expect(result.summary.atRiskCustomerCount).toBe(1);
  });

  it("deduplicates territory coverage from assigned customers", () => {
    const result = buildMyPerformanceData(baseInput);

    expect(result.summary.territoryCoverageCount).toBe(2);
    expect(result.territoryCoverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          territoryName: "Mangaluru Central",
          assignedCustomerCount: 2,
          atRiskCustomerCount: 1,
        }),
        expect.objectContaining({
          territoryName: "Puttur",
          assignedCustomerCount: 1,
          atRiskCustomerCount: 0,
        }),
      ]),
    );
  });

  it("excludes records belonging to another Sales Executive", () => {
    const result = buildMyPerformanceData(baseInput);

    expect(result.summary.assignedCustomerCount).toBe(3);
    expect(result.summary.monthlyPlannedVisits).toBe(2);
    expect(result.summary.todaysPlannedVisits).toBe(1);
    expect(result.workload.overdueFollowUps).toBe(1);
    expect(result.workload.overdueTasks).toBe(1);
  });
});
