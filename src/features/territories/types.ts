import type { CurrentUserRole } from "@/lib/auth/current-user";

export interface TerritoryPageContext {
  role: CurrentUserRole;
  roleLabel: "Manager" | "Sales Executive";
}

export interface TerritorySummary {
  territoriesWithCustomers: number;
  assignedCustomers: number;
  plannedVisits: number;
  completedVisits: number;
  completionRate: number;
  atRiskCustomers: number;
}

export interface TerritoryMetric {
  id: string;
  name: string;
  assignedCustomerCount: number;
  activeCustomerCount: number;
  atRiskCustomerCount: number;
  plannedVisits: number;
  completedVisits: number;
  completionRate: number;
  overdueFollowUps: number;
  overdueTasks: number;
  coveredExecutiveCount: number;
}

export interface TerritoryWorkspaceData {
  today: string;
  weekStart: string;
  weekEnd: string;
  periodLabel: string;
  summary: TerritorySummary;
  territories: TerritoryMetric[];
}

export type TerritoryWorkspaceResult =
  | { status: "ready"; data: TerritoryWorkspaceData }
  | { status: "unavailable"; periodLabel: string; today: string };
