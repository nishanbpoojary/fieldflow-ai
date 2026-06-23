import { describe, expect, it } from "vitest";

import {
  buildTerritoryWorkspaceData,
  calculateTerritoryCompletionRate,
} from "@/features/territories/data/territory-rules";

const baseInput = {
  today: "2026-06-23",
  weekStart: "2026-06-22",
  weekEnd: "2026-06-28",
  periodLabel: "Week of 22-28 June 2026",
  territories: [
    { id: "territory-1", name: "Mangaluru Central" },
    { id: "territory-2", name: "Puttur" },
  ],
  customers: [
    {
      id: "customer-1",
      territoryId: "territory-1",
      assignedSalesExecutiveId: "exec-1",
      status: "active" as const,
    },
    {
      id: "customer-2",
      territoryId: "territory-1",
      assignedSalesExecutiveId: "exec-1",
      status: "at_risk" as const,
    },
    {
      id: "customer-3",
      territoryId: "territory-1",
      assignedSalesExecutiveId: "exec-2",
      status: "at_risk" as const,
    },
    {
      id: "customer-4",
      territoryId: "territory-2",
      assignedSalesExecutiveId: "exec-2",
      status: "converted" as const,
    },
  ],
  visitPlans: [
    {
      customerId: "customer-1",
      scheduledDate: "2026-06-23",
      status: "pending" as const,
    },
    {
      customerId: "customer-2",
      scheduledDate: "2026-06-24",
      status: "completed" as const,
    },
    {
      customerId: "customer-4",
      scheduledDate: "2026-06-25",
      status: "cancelled" as const,
    },
  ],
  visits: [
    {
      customerId: "customer-1",
      completedDate: "2026-06-23",
    },
    {
      customerId: "customer-4",
      completedDate: "2026-06-21",
    },
  ],
  followUps: [
    {
      customerId: "customer-2",
      dueDate: "2026-06-21",
      state: "open" as const,
    },
    {
      customerId: "customer-3",
      dueDate: "2026-06-20",
      state: "completed" as const,
    },
  ],
  tasks: [
    {
      relatedCustomerId: "customer-3",
      dueDate: "2026-06-22",
      state: "open" as const,
    },
    {
      relatedCustomerId: null,
      dueDate: "2026-06-22",
      state: "open" as const,
    },
  ],
};

describe("territory rules", () => {
  it("calculates territory completion rate from completed and planned visits", () => {
    expect(calculateTerritoryCompletionRate(2, 4)).toBe(50);
  });

  it("returns 0 completion when there are no planned visits", () => {
    expect(calculateTerritoryCompletionRate(2, 0)).toBe(0);
  });

  it("aggregates planned and completed visits by customer territory", () => {
    const result = buildTerritoryWorkspaceData(baseInput);

    expect(result.summary.plannedVisits).toBe(2);
    expect(result.summary.completedVisits).toBe(1);
    expect(result.summary.completionRate).toBe(50);
    expect(result.territories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "territory-1",
          plannedVisits: 2,
          completedVisits: 1,
          completionRate: 50,
        }),
        expect.objectContaining({
          id: "territory-2",
          plannedVisits: 0,
          completedVisits: 0,
          completionRate: 0,
        }),
      ]),
    );
  });

  it("aggregates at-risk customers by territory", () => {
    const result = buildTerritoryWorkspaceData(baseInput);

    expect(result.summary.atRiskCustomers).toBe(2);
    expect(result.territories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "territory-1",
          assignedCustomerCount: 3,
          activeCustomerCount: 1,
          atRiskCustomerCount: 2,
        }),
      ]),
    );
  });

  it("aggregates only customer-linked overdue work by territory", () => {
    const result = buildTerritoryWorkspaceData(baseInput);

    expect(result.territories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "territory-1",
          overdueFollowUps: 1,
          overdueTasks: 1,
        }),
        expect.objectContaining({
          id: "territory-2",
          overdueFollowUps: 0,
          overdueTasks: 0,
        }),
      ]),
    );
  });

  it("does not assign internal or unlinked tasks to a territory", () => {
    const result = buildTerritoryWorkspaceData({
      ...baseInput,
      tasks: [
        {
          relatedCustomerId: null,
          dueDate: "2026-06-22",
          state: "open" as const,
        },
        {
          relatedCustomerId: "missing-customer",
          dueDate: "2026-06-22",
          state: "open" as const,
        },
      ],
    });

    expect(
      result.territories.reduce(
        (total, territory) => total + territory.overdueTasks,
        0,
      ),
    ).toBe(0);
  });

  it("deduplicates covered Sales Executives by territory", () => {
    const result = buildTerritoryWorkspaceData(baseInput);

    expect(result.territories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "territory-1",
          coveredExecutiveCount: 2,
        }),
        expect.objectContaining({
          id: "territory-2",
          coveredExecutiveCount: 1,
        }),
      ]),
    );
  });
});

