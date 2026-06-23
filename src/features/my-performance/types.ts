import type { CurrentUserRole } from "@/lib/auth/current-user";

export interface MyPerformancePageContext {
  role: CurrentUserRole;
  roleLabel: "Manager" | "Sales Executive";
}

export interface MyPerformanceSummary {
  assignedCustomerCount: number;
  atRiskCustomerCount: number;
  monthlyPlannedVisits: number;
  monthlyCompletedVisits: number;
  monthlyCompletionRate: number;
  todaysPlannedVisits: number;
  todaysCompletedVisits: number;
  todaysPendingVisits: number;
  openFollowUps: number;
  overdueFollowUps: number;
  openTasks: number;
  overdueTasks: number;
  territoryCoverageCount: number;
}

export interface MyPerformanceTrendPoint {
  date: string;
  label: string;
  plannedVisits: number;
  completedVisits: number;
}

export interface MyPerformanceTerritoryCoverage {
  territoryName: string;
  assignedCustomerCount: number;
  atRiskCustomerCount: number;
}

export interface MyPerformanceWorkload {
  openFollowUps: number;
  overdueFollowUps: number;
  openTasks: number;
  overdueTasks: number;
  totalOpenWork: number;
  totalOverdueWork: number;
}

export interface MyPerformanceData {
  today: string;
  weekStart: string;
  weekEnd: string;
  monthStart: string;
  monthEndExclusive: string;
  periodLabel: string;
  summary: MyPerformanceSummary;
  dailyTrend: MyPerformanceTrendPoint[];
  territoryCoverage: MyPerformanceTerritoryCoverage[];
  workload: MyPerformanceWorkload;
}

export type MyPerformanceResult =
  | { status: "ready"; data: MyPerformanceData }
  | { status: "empty"; periodLabel: string; today: string }
  | { status: "unavailable"; periodLabel: string; today: string };

