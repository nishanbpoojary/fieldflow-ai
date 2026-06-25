import type { CurrentUserRole } from "@/lib/auth/current-user";

export interface TeamPerformancePageContext {
  role: CurrentUserRole;
  roleLabel: "Manager" | "Sales Executive";
  isOrganizationAdmin?: boolean;
}

export interface TeamPerformanceSummary {
  activeExecutiveCount: number;
  plannedVisits: number;
  completedVisits: number;
  completionRate: number;
  overdueOpenWork: number;
  atRiskCustomers: number;
}

export interface TeamPerformanceExecutive {
  id: string;
  name: string;
  territories: string[];
  assignedCustomerCount: number;
  plannedVisits: number;
  completedVisits: number;
  completionRate: number;
  overdueFollowUps: number;
  overdueTasks: number;
  overdueOpenWork: number;
  atRiskCustomers: number;
}

export interface TeamPerformanceData {
  today: string;
  weekStart: string;
  weekEnd: string;
  periodLabel: string;
  summary: TeamPerformanceSummary;
  executives: TeamPerformanceExecutive[];
}

export type TeamPerformanceResult =
  | { status: "ready"; data: TeamPerformanceData }
  | { status: "unavailable"; periodLabel: string; today: string };

