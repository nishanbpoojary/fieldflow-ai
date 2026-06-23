import type {
  TeamPerformanceData,
  TeamPerformanceExecutive,
  TeamPerformanceSummary,
} from "@/features/team-performance/types";

type CustomerStatus = "prospect" | "active" | "at_risk" | "converted" | "inactive";
type VisitPlanStatus = "pending" | "completed" | "missed" | "cancelled";
type WorkItemState = "open" | "completed" | "cancelled";

export interface TeamPerformanceExecutiveInput {
  id: string;
  name: string;
}

export interface TeamPerformanceTerritoryInput {
  id: string;
  name: string;
}

export interface TeamPerformanceCustomerInput {
  id: string;
  territoryId: string;
  assignedSalesExecutiveId: string;
  status: CustomerStatus;
}

export interface TeamPerformanceVisitPlanInput {
  assignedSalesExecutiveId: string;
  scheduledDate: string;
  status: VisitPlanStatus;
}

export interface TeamPerformanceVisitInput {
  assignedSalesExecutiveId: string;
  completedDate: string;
}

export interface TeamPerformanceWorkItemInput {
  assignedSalesExecutiveId: string;
  dueDate: string;
  state: WorkItemState;
}

export interface BuildTeamPerformanceInput {
  today: string;
  weekStart: string;
  weekEnd: string;
  periodLabel: string;
  executives: TeamPerformanceExecutiveInput[];
  territories: TeamPerformanceTerritoryInput[];
  customers: TeamPerformanceCustomerInput[];
  visitPlans: TeamPerformanceVisitPlanInput[];
  visits: TeamPerformanceVisitInput[];
  followUps: TeamPerformanceWorkItemInput[];
  tasks: TeamPerformanceWorkItemInput[];
}

export function calculateCompletionRate(completed: number, planned: number) {
  if (planned <= 0) {
    return 0;
  }

  return Math.round((completed / planned) * 100);
}

function isWithinRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

function isOpenOverdue(item: TeamPerformanceWorkItemInput, today: string) {
  return item.state === "open" && item.dueDate < today;
}

export function buildTeamPerformanceData({
  today,
  weekStart,
  weekEnd,
  periodLabel,
  executives,
  territories,
  customers,
  visitPlans,
  visits,
  followUps,
  tasks,
}: BuildTeamPerformanceInput): TeamPerformanceData {
  const territoryById = new Map(
    territories.map((territory) => [territory.id, territory.name]),
  );

  const plannedByExecutive = new Map<string, number>();
  const completedByExecutive = new Map<string, number>();
  const customerCountByExecutive = new Map<string, number>();
  const atRiskByExecutive = new Map<string, number>();
  const territoriesByExecutive = new Map<string, Set<string>>();
  const overdueFollowUpsByExecutive = new Map<string, number>();
  const overdueTasksByExecutive = new Map<string, number>();

  visitPlans
    .filter(
      (plan) =>
        plan.status !== "cancelled" &&
        isWithinRange(plan.scheduledDate, weekStart, weekEnd),
    )
    .forEach((plan) => {
      plannedByExecutive.set(
        plan.assignedSalesExecutiveId,
        (plannedByExecutive.get(plan.assignedSalesExecutiveId) ?? 0) + 1,
      );
    });

  visits
    .filter((visit) => isWithinRange(visit.completedDate, weekStart, weekEnd))
    .forEach((visit) => {
      completedByExecutive.set(
        visit.assignedSalesExecutiveId,
        (completedByExecutive.get(visit.assignedSalesExecutiveId) ?? 0) + 1,
      );
    });

  customers.forEach((customer) => {
    customerCountByExecutive.set(
      customer.assignedSalesExecutiveId,
      (customerCountByExecutive.get(customer.assignedSalesExecutiveId) ?? 0) + 1,
    );

    if (customer.status === "at_risk") {
      atRiskByExecutive.set(
        customer.assignedSalesExecutiveId,
        (atRiskByExecutive.get(customer.assignedSalesExecutiveId) ?? 0) + 1,
      );
    }

    const territoryName = territoryById.get(customer.territoryId);

    if (!territoryName) {
      return;
    }

    const executiveTerritories =
      territoriesByExecutive.get(customer.assignedSalesExecutiveId) ?? new Set();
    executiveTerritories.add(territoryName);
    territoriesByExecutive.set(
      customer.assignedSalesExecutiveId,
      executiveTerritories,
    );
  });

  followUps.filter((item) => isOpenOverdue(item, today)).forEach((item) => {
    overdueFollowUpsByExecutive.set(
      item.assignedSalesExecutiveId,
      (overdueFollowUpsByExecutive.get(item.assignedSalesExecutiveId) ?? 0) + 1,
    );
  });

  tasks.filter((item) => isOpenOverdue(item, today)).forEach((item) => {
    overdueTasksByExecutive.set(
      item.assignedSalesExecutiveId,
      (overdueTasksByExecutive.get(item.assignedSalesExecutiveId) ?? 0) + 1,
    );
  });

  const executiveMetrics: TeamPerformanceExecutive[] = executives.map(
    (executive) => {
      const plannedVisits = plannedByExecutive.get(executive.id) ?? 0;
      const completedVisits = completedByExecutive.get(executive.id) ?? 0;
      const overdueFollowUps = overdueFollowUpsByExecutive.get(executive.id) ?? 0;
      const overdueTasks = overdueTasksByExecutive.get(executive.id) ?? 0;

      return {
        id: executive.id,
        name: executive.name,
        territories: Array.from(territoriesByExecutive.get(executive.id) ?? [])
          .sort((first, second) => first.localeCompare(second)),
        assignedCustomerCount: customerCountByExecutive.get(executive.id) ?? 0,
        plannedVisits,
        completedVisits,
        completionRate: calculateCompletionRate(completedVisits, plannedVisits),
        overdueFollowUps,
        overdueTasks,
        overdueOpenWork: overdueFollowUps + overdueTasks,
        atRiskCustomers: atRiskByExecutive.get(executive.id) ?? 0,
      };
    },
  );

  const summary = executiveMetrics.reduce<TeamPerformanceSummary>(
    (totals, executive) => ({
      activeExecutiveCount: totals.activeExecutiveCount + 1,
      plannedVisits: totals.plannedVisits + executive.plannedVisits,
      completedVisits: totals.completedVisits + executive.completedVisits,
      completionRate: 0,
      overdueOpenWork: totals.overdueOpenWork + executive.overdueOpenWork,
      atRiskCustomers: totals.atRiskCustomers + executive.atRiskCustomers,
    }),
    {
      activeExecutiveCount: 0,
      plannedVisits: 0,
      completedVisits: 0,
      completionRate: 0,
      overdueOpenWork: 0,
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
      completionRate: calculateCompletionRate(
        summary.completedVisits,
        summary.plannedVisits,
      ),
    },
    executives: executiveMetrics.sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
  };
}

