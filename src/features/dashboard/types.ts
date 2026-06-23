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

export type FollowUpPriority = "High" | "Medium" | "Low";

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
export type ManagerInsightPriority = "high" | "medium" | "low";

export interface ManagerInsight {
  id: string;
  priority: ManagerInsightPriority;
  title: string;
  evidence: string;
  recommendedAction: string;
}

export interface ManagerInsightsPayload {
  sourceLabel: "Rules-based insight";
  periodLabel: string;
  generatedFor: string;
  insights: ManagerInsight[];
}

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

export type VisitStatus = "Pending" | "Completed" | "Missed" | "Cancelled";
export type VisitPriority = "High" | "Medium" | "Low";

export interface PlannedVisit {
  id: string;
  customerName: string;
  territory: string;
  scheduledTime: string;
  status: VisitStatus;
  priority: VisitPriority;
}

export type CustomerStatus =
  | "Prospect"
  | "Active"
  | "At risk"
  | "Converted"
  | "Inactive";

export interface AssignedCustomer {
  id: string;
  companyName: string;
  territory: string;
  status: CustomerStatus;
  nextFollowUp: string | null;
}

export type TaskPriority = "High" | "Medium" | "Low";

export type SalesPriorityStatus = "Overdue" | "Due today" | "Upcoming";

export interface SalesPriorityItem {
  id: string;
  kind: "Follow-up" | "Task";
  title: string;
  customerName: string | null;
  territory: string | null;
  dueDate: string;
  priority: TaskPriority;
  status: SalesPriorityStatus;
  state: "Open";
}

export interface PersonalPerformance {
  plannedVisits: number;
  completedVisits: number;
  completionPercentage: number;
  summary: string;
}

export interface SalesFocus {
  title: string;
  detail: string;
  pendingVisits: number;
  overdueWork: number;
}

export interface SalesExecutiveDashboardData {
  today: string;
  weekStart: string;
  weekEnd: string;
  periodLabel: string;
  summary: string;
  kpis: DashboardKpi[];
  todaysVisits: PlannedVisit[];
  assignedCustomers: AssignedCustomer[];
  priorities: SalesPriorityItem[];
  performance: PersonalPerformance;
  focus: SalesFocus;
}

export type SalesExecutiveDashboardResult =
  | { status: "ready"; data: SalesExecutiveDashboardData }
  | { status: "empty"; periodLabel: string; today: string }
  | { status: "unavailable"; periodLabel: string; today: string };

export interface VisitComparisonChartPoint {
  label: string;
  plannedVisits: number;
  completedVisits: number;
}

export interface CompletionTrendChartPoint {
  label: string;
  completionPercentage: number;
}

export interface CustomerStatusChartPoint {
  status: string;
  count: number;
  fill: string;
}

export interface ManagerDashboardData {
  today: string;
  weekStart: string;
  weekEnd: string;
  periodLabel: string;
  summary: string;
  kpis: DashboardKpi[];
  overdueFollowUps: OverdueFollowUp[];
  teamPerformance: TeamPerformanceMember[];
  managerPriorities: ManagerPriority[];
  executiveVisitChartData: VisitComparisonChartPoint[];
  territoryVisitChartData: VisitComparisonChartPoint[];
  completionTrendChartData: CompletionTrendChartPoint[];
  customerStatusChartData: CustomerStatusChartPoint[];
}

export type ManagerDashboardResult =
  | { status: "ready"; data: ManagerDashboardData }
  | { status: "empty"; periodLabel: string; today: string }
  | { status: "unavailable"; periodLabel: string; today: string };
