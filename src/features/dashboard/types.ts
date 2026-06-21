export type KpiTone = "blue" | "emerald" | "amber" | "rose" | "violet";

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  context: string;
  change: string;
  tone: KpiTone;
}

export type FollowUpPriority = "High" | "Medium";

export interface OverdueFollowUp {
  id: string;
  customerName: string;
  territory: string;
  priority: FollowUpPriority;
  dueStatus: string;
  assignedExecutive: string;
}

export interface TeamPerformanceMember {
  id: string;
  name: string;
  territory: string;
  plannedVisits: number;
  completedVisits: number;
  completionPercentage: number;
}

export type PriorityTone = "critical" | "attention" | "opportunity";

export interface ManagerPriority {
  id: string;
  label: string;
  detail: string;
  action: string;
  tone: PriorityTone;
}

export interface DashboardNavigationItem {
  label: string;
  shortLabel: string;
  active: boolean;
}
