import type {
  TerritoryMetric,
  TerritorySummary,
  TerritoryWorkspaceData,
} from "@/features/territories/types";

type CustomerStatus = "prospect" | "active" | "at_risk" | "converted" | "inactive";
type VisitPlanStatus = "pending" | "completed" | "missed" | "cancelled";
type WorkItemState = "open" | "completed" | "cancelled";

export interface TerritoryInput {
  id: string;
  name: string;
}

export interface TerritoryCustomerInput {
  id: string;
  territoryId: string;
  assignedSalesExecutiveId: string;
  status: CustomerStatus;
}

export interface TerritoryVisitPlanInput {
  customerId: string;
  scheduledDate: string;
  status: VisitPlanStatus;
}

export interface TerritoryVisitInput {
  customerId: string;
  completedDate: string;
}

export interface TerritoryFollowUpInput {
  customerId: string;
  dueDate: string;
  state: WorkItemState;
}

export interface TerritoryTaskInput {
  relatedCustomerId: string | null;
  dueDate: string;
  state: WorkItemState;
}

export interface BuildTerritoryWorkspaceInput {
  today: string;
  weekStart: string;
  weekEnd: string;
  periodLabel: string;
  territories: TerritoryInput[];
  customers: TerritoryCustomerInput[];
  visitPlans: TerritoryVisitPlanInput[];
  visits: TerritoryVisitInput[];
  followUps: TerritoryFollowUpInput[];
  tasks: TerritoryTaskInput[];
}

export function calculateTerritoryCompletionRate(
  completed: number,
  planned: number,
) {
  if (planned <= 0) {
    return 0;
  }

  return Math.round((completed / planned) * 100);
}

function isWithinRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

function isOpenOverdue(
  item: { dueDate: string; state: WorkItemState },
  today: string,
) {
  return item.state === "open" && item.dueDate < today;
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export function buildTerritoryWorkspaceData({
  today,
  weekStart,
  weekEnd,
  periodLabel,
  territories,
  customers,
  visitPlans,
  visits,
  followUps,
  tasks,
}: BuildTerritoryWorkspaceInput): TerritoryWorkspaceData {
  const customerTerritoryById = new Map(
    customers.map((customer) => [customer.id, customer.territoryId]),
  );
  const customerCountByTerritory = new Map<string, number>();
  const activeCustomerCountByTerritory = new Map<string, number>();
  const atRiskCustomerCountByTerritory = new Map<string, number>();
  const coveredExecutivesByTerritory = new Map<string, Set<string>>();
  const plannedVisitsByTerritory = new Map<string, number>();
  const completedVisitsByTerritory = new Map<string, number>();
  const overdueFollowUpsByTerritory = new Map<string, number>();
  const overdueTasksByTerritory = new Map<string, number>();

  customers.forEach((customer) => {
    increment(customerCountByTerritory, customer.territoryId);

    if (customer.status === "active") {
      increment(activeCustomerCountByTerritory, customer.territoryId);
    }

    if (customer.status === "at_risk") {
      increment(atRiskCustomerCountByTerritory, customer.territoryId);
    }

    const coveredExecutives =
      coveredExecutivesByTerritory.get(customer.territoryId) ?? new Set();
    coveredExecutives.add(customer.assignedSalesExecutiveId);
    coveredExecutivesByTerritory.set(customer.territoryId, coveredExecutives);
  });

  visitPlans
    .filter(
      (plan) =>
        plan.status !== "cancelled" &&
        isWithinRange(plan.scheduledDate, weekStart, weekEnd),
    )
    .forEach((plan) => {
      const territoryId = customerTerritoryById.get(plan.customerId);

      if (territoryId) {
        increment(plannedVisitsByTerritory, territoryId);
      }
    });

  visits
    .filter((visit) => isWithinRange(visit.completedDate, weekStart, weekEnd))
    .forEach((visit) => {
      const territoryId = customerTerritoryById.get(visit.customerId);

      if (territoryId) {
        increment(completedVisitsByTerritory, territoryId);
      }
    });

  followUps.filter((item) => isOpenOverdue(item, today)).forEach((followUp) => {
    const territoryId = customerTerritoryById.get(followUp.customerId);

    if (territoryId) {
      increment(overdueFollowUpsByTerritory, territoryId);
    }
  });

  tasks.filter((item) => isOpenOverdue(item, today)).forEach((task) => {
    if (!task.relatedCustomerId) {
      return;
    }

    const territoryId = customerTerritoryById.get(task.relatedCustomerId);

    if (territoryId) {
      increment(overdueTasksByTerritory, territoryId);
    }
  });

  const territoryMetrics: TerritoryMetric[] = territories
    .map((territory) => {
      const plannedVisits = plannedVisitsByTerritory.get(territory.id) ?? 0;
      const completedVisits = completedVisitsByTerritory.get(territory.id) ?? 0;

      return {
        id: territory.id,
        name: territory.name,
        assignedCustomerCount: customerCountByTerritory.get(territory.id) ?? 0,
        activeCustomerCount:
          activeCustomerCountByTerritory.get(territory.id) ?? 0,
        atRiskCustomerCount:
          atRiskCustomerCountByTerritory.get(territory.id) ?? 0,
        plannedVisits,
        completedVisits,
        completionRate: calculateTerritoryCompletionRate(
          completedVisits,
          plannedVisits,
        ),
        overdueFollowUps: overdueFollowUpsByTerritory.get(territory.id) ?? 0,
        overdueTasks: overdueTasksByTerritory.get(territory.id) ?? 0,
        coveredExecutiveCount:
          coveredExecutivesByTerritory.get(territory.id)?.size ?? 0,
      };
    })
    .sort((first, second) => first.name.localeCompare(second.name));

  const summary = territoryMetrics.reduce<TerritorySummary>(
    (totals, territory) => ({
      territoriesWithCustomers:
        totals.territoriesWithCustomers +
        (territory.assignedCustomerCount > 0 ? 1 : 0),
      assignedCustomers: totals.assignedCustomers + territory.assignedCustomerCount,
      plannedVisits: totals.plannedVisits + territory.plannedVisits,
      completedVisits: totals.completedVisits + territory.completedVisits,
      completionRate: 0,
      atRiskCustomers: totals.atRiskCustomers + territory.atRiskCustomerCount,
    }),
    {
      territoriesWithCustomers: 0,
      assignedCustomers: 0,
      plannedVisits: 0,
      completedVisits: 0,
      completionRate: 0,
      atRiskCustomers: 0,
    },
  );

  return {
    today,
    weekStart,
    weekEnd,
    periodLabel,
    summary: {
      ...summary,
      completionRate: calculateTerritoryCompletionRate(
        summary.completedVisits,
        summary.plannedVisits,
      ),
    },
    territories: territoryMetrics,
  };
}

