import type {
  MyPerformanceData,
  MyPerformanceSummary,
  MyPerformanceTerritoryCoverage,
  MyPerformanceTrendPoint,
  MyPerformanceWorkload,
} from "@/features/my-performance/types";

type CustomerStatus = "prospect" | "active" | "at_risk" | "converted" | "inactive";
type VisitPlanStatus = "pending" | "completed" | "missed" | "cancelled";
type WorkItemState = "open" | "completed" | "cancelled";

export interface MyPerformanceTerritoryInput {
  id: string;
  name: string;
}

export interface MyPerformanceCustomerInput {
  id: string;
  territoryId: string;
  assignedSalesExecutiveId: string;
  status: CustomerStatus;
}

export interface MyPerformanceVisitPlanInput {
  assignedSalesExecutiveId: string;
  scheduledDate: string;
  status: VisitPlanStatus;
}

export interface MyPerformanceVisitInput {
  assignedSalesExecutiveId: string;
  completedDate: string;
}

export interface MyPerformanceWorkItemInput {
  assignedSalesExecutiveId: string;
  dueDate: string;
  state: WorkItemState;
}

export interface BuildMyPerformanceInput {
  salesExecutiveId: string;
  today: string;
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  monthEndExclusive: string;
  periodLabel: string;
  territories: MyPerformanceTerritoryInput[];
  customers: MyPerformanceCustomerInput[];
  visitPlans: MyPerformanceVisitPlanInput[];
  visits: MyPerformanceVisitInput[];
  followUps: MyPerformanceWorkItemInput[];
  tasks: MyPerformanceWorkItemInput[];
}

export function calculatePersonalCompletionRate(
  completed: number,
  planned: number,
) {
  if (planned <= 0) {
    return 0;
  }

  return Math.min(Math.round((completed / planned) * 100), 100);
}

function isInInclusiveRange(date: string, startDate: string, endDate: string) {
  return date >= startDate && date <= endDate;
}

function isInExclusiveRange(date: string, startDate: string, endExclusive: string) {
  return date >= startDate && date < endExclusive;
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));

  return nextDate.toISOString().slice(0, 10);
}

function formatTrendLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function isOpenOverdue(item: MyPerformanceWorkItemInput, today: string) {
  return item.state === "open" && item.dueDate < today;
}

export function buildMyPerformanceData({
  salesExecutiveId,
  today,
  weekStart,
  weekEnd,
  monthStart,
  monthEndExclusive,
  periodLabel,
  territories,
  customers,
  visitPlans,
  visits,
  followUps,
  tasks,
}: BuildMyPerformanceInput): MyPerformanceData {
  const assignedCustomers = customers.filter(
    (customer) => customer.assignedSalesExecutiveId === salesExecutiveId,
  );
  const assignedVisitPlans = visitPlans.filter(
    (plan) => plan.assignedSalesExecutiveId === salesExecutiveId,
  );
  const assignedVisits = visits.filter(
    (visit) => visit.assignedSalesExecutiveId === salesExecutiveId,
  );
  const assignedFollowUps = followUps.filter(
    (followUp) => followUp.assignedSalesExecutiveId === salesExecutiveId,
  );
  const assignedTasks = tasks.filter(
    (task) => task.assignedSalesExecutiveId === salesExecutiveId,
  );
  const territoryById = new Map(
    territories.map((territory) => [territory.id, territory.name]),
  );
  const monthlyPlans = assignedVisitPlans.filter(
    (plan) =>
      plan.status !== "cancelled" &&
      isInExclusiveRange(plan.scheduledDate, monthStart, monthEndExclusive),
  );
  const monthlyCompletedVisits = assignedVisits.filter((visit) =>
    isInExclusiveRange(visit.completedDate, monthStart, monthEndExclusive),
  );
  const todaysPlans = assignedVisitPlans.filter(
    (plan) => plan.status !== "cancelled" && plan.scheduledDate === today,
  );
  const todaysCompletedVisits = assignedVisits.filter(
    (visit) => visit.completedDate === today,
  );
  const openFollowUps = assignedFollowUps.filter(
    (followUp) => followUp.state === "open",
  );
  const openTasks = assignedTasks.filter((task) => task.state === "open");
  const overdueFollowUps = openFollowUps.filter((followUp) =>
    isOpenOverdue(followUp, today),
  );
  const overdueTasks = openTasks.filter((task) => isOpenOverdue(task, today));
  const territoryCustomerCounts = new Map<string, number>();
  const territoryAtRiskCounts = new Map<string, number>();

  assignedCustomers.forEach((customer) => {
    territoryCustomerCounts.set(
      customer.territoryId,
      (territoryCustomerCounts.get(customer.territoryId) ?? 0) + 1,
    );

    if (customer.status === "at_risk") {
      territoryAtRiskCounts.set(
        customer.territoryId,
        (territoryAtRiskCounts.get(customer.territoryId) ?? 0) + 1,
      );
    }
  });

  const territoryCoverage: MyPerformanceTerritoryCoverage[] = Array.from(
    territoryCustomerCounts.entries(),
    ([territoryId, assignedCustomerCount]) => ({
      territoryName: territoryById.get(territoryId) ?? "Territory unavailable",
      assignedCustomerCount,
      atRiskCustomerCount: territoryAtRiskCounts.get(territoryId) ?? 0,
    }),
  ).sort((first, second) =>
    first.territoryName.localeCompare(second.territoryName),
  );

  const dailyTrend: MyPerformanceTrendPoint[] = Array.from(
    { length: 7 },
    (_, index) => {
      const date = addDays(weekStart, index);
      const plannedVisits = assignedVisitPlans.filter(
        (plan) =>
          plan.status !== "cancelled" &&
          isInInclusiveRange(plan.scheduledDate, weekStart, weekEnd) &&
          plan.scheduledDate === date,
      ).length;
      const completedVisits = assignedVisits.filter(
        (visit) =>
          isInInclusiveRange(visit.completedDate, weekStart, weekEnd) &&
          visit.completedDate === date,
      ).length;

      return {
        date,
        label: formatTrendLabel(date),
        plannedVisits,
        completedVisits,
      };
    },
  );

  const workload: MyPerformanceWorkload = {
    openFollowUps: openFollowUps.length,
    overdueFollowUps: overdueFollowUps.length,
    openTasks: openTasks.length,
    overdueTasks: overdueTasks.length,
    totalOpenWork: openFollowUps.length + openTasks.length,
    totalOverdueWork: overdueFollowUps.length + overdueTasks.length,
  };
  const summary: MyPerformanceSummary = {
    assignedCustomerCount: assignedCustomers.length,
    atRiskCustomerCount: assignedCustomers.filter(
      (customer) => customer.status === "at_risk",
    ).length,
    monthlyPlannedVisits: monthlyPlans.length,
    monthlyCompletedVisits: monthlyCompletedVisits.length,
    monthlyCompletionRate: calculatePersonalCompletionRate(
      monthlyCompletedVisits.length,
      monthlyPlans.length,
    ),
    todaysPlannedVisits: todaysPlans.length,
    todaysCompletedVisits: todaysCompletedVisits.length,
    todaysPendingVisits: todaysPlans.filter((plan) => plan.status === "pending")
      .length,
    openFollowUps: openFollowUps.length,
    overdueFollowUps: overdueFollowUps.length,
    openTasks: openTasks.length,
    overdueTasks: overdueTasks.length,
    territoryCoverageCount: territoryCoverage.length,
  };

  return {
    today,
    weekStart,
    weekEnd,
    monthStart,
    monthEndExclusive,
    periodLabel,
    summary,
    dailyTrend,
    territoryCoverage,
    workload,
  };
}
