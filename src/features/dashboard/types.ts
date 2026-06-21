export type KpiTone = "blue" | "emerald" | "amber" | "rose" | "violet";

export type AppRole = "manager" | "sales_executive";

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

export type VisitStatus = "Completed" | "Scheduled" | "Pending";
export type VisitPriority = "High" | "Standard";

export interface PlannedVisit {
  id: string;
  customerName: string;
  territory: string;
  scheduledTime: string;
  status: VisitStatus;
  priority: VisitPriority;
}

export type CustomerStatus = "Active" | "Follow-up needed" | "New";

export interface AssignedCustomer {
  id: string;
  companyName: string;
  territory: string;
  status: CustomerStatus;
  nextFollowUp: string;
}

export type TaskPriority = "High" | "Medium" | "Low";

export interface UpcomingTask {
  id: string;
  title: string;
  customerName: string;
  dueDate: string;
  priority: TaskPriority;
}

export interface PersonalPerformance {
  plannedVisits: number;
  completedVisits: number;
  completionPercentage: number;
  summary: string;
}
