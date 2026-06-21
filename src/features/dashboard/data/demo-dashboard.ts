import type {
  DashboardKpi,
  DashboardNavigationItem,
  ManagerPriority,
  OverdueFollowUp,
  TeamPerformanceMember,
} from "@/features/dashboard/types";

export const dashboardNavigation: DashboardNavigationItem[] = [
  { label: "Overview", shortLabel: "OV", active: true },
  { label: "Customers", shortLabel: "CU", active: false },
  { label: "Visits", shortLabel: "VI", active: false },
  { label: "Follow-ups", shortLabel: "FU", active: false },
  { label: "Tasks", shortLabel: "TA", active: false },
  { label: "Team Performance", shortLabel: "TP", active: false },
  { label: "Territories", shortLabel: "TE", active: false },
];

export const dashboardKpis: DashboardKpi[] = [
  {
    id: "total-customers",
    label: "Total Customers",
    value: "148",
    context: "Across 4 active territories",
    change: "+12 this month",
    tone: "blue",
  },
  {
    id: "planned-visits",
    label: "Planned Visits",
    value: "42",
    context: "Scheduled for this week",
    change: "8 due today",
    tone: "violet",
  },
  {
    id: "completed-visits",
    label: "Completed Visits",
    value: "31",
    context: "74% of weekly plan",
    change: "+6 since yesterday",
    tone: "emerald",
  },
  {
    id: "overdue-follow-ups",
    label: "Overdue Follow-ups",
    value: "9",
    context: "4 marked high priority",
    change: "Needs attention",
    tone: "rose",
  },
  {
    id: "conversion-rate",
    label: "Conversion Rate",
    value: "28.4%",
    context: "From completed visits",
    change: "+2.1% vs last month",
    tone: "amber",
  },
];

export const overdueFollowUps: OverdueFollowUp[] = [
  {
    id: "follow-up-1",
    customerName: "Northstar Motors",
    territory: "Metro North",
    priority: "High",
    dueStatus: "3 days overdue",
    assignedExecutive: "Maya Chen",
  },
  {
    id: "follow-up-2",
    customerName: "BluePeak Auto",
    territory: "West Ridge",
    priority: "High",
    dueStatus: "2 days overdue",
    assignedExecutive: "Arjun Mehta",
  },
  {
    id: "follow-up-3",
    customerName: "Horizon Fleet Works",
    territory: "Central Market",
    priority: "Medium",
    dueStatus: "Due yesterday",
    assignedExecutive: "Leena Brooks",
  },
  {
    id: "follow-up-4",
    customerName: "Cedarline Cars",
    territory: "South District",
    priority: "Medium",
    dueStatus: "Due yesterday",
    assignedExecutive: "Daniel Kim",
  },
];

export const teamPerformance: TeamPerformanceMember[] = [
  {
    id: "member-1",
    name: "Maya Chen",
    territory: "Metro North",
    plannedVisits: 12,
    completedVisits: 10,
    completionPercentage: 83,
  },
  {
    id: "member-2",
    name: "Arjun Mehta",
    territory: "West Ridge",
    plannedVisits: 11,
    completedVisits: 8,
    completionPercentage: 73,
  },
  {
    id: "member-3",
    name: "Leena Brooks",
    territory: "Central Market",
    plannedVisits: 10,
    completedVisits: 7,
    completionPercentage: 70,
  },
  {
    id: "member-4",
    name: "Daniel Kim",
    territory: "South District",
    plannedVisits: 9,
    completedVisits: 6,
    completionPercentage: 67,
  },
];

export const managerPriorities: ManagerPriority[] = [
  {
    id: "priority-1",
    label: "Clear high-priority follow-ups",
    detail: "Four customer commitments are overdue and marked high priority.",
    action: "Review with Maya and Arjun today",
    tone: "critical",
  },
  {
    id: "priority-2",
    label: "Recover the visit completion gap",
    detail: "Eleven planned visits remain open with two working days left.",
    action: "Confirm schedules before the afternoon check-in",
    tone: "attention",
  },
  {
    id: "priority-3",
    label: "Build on Metro North momentum",
    detail: "Metro North is leading the team at 83% visit completion.",
    action: "Share the territory playbook with the wider team",
    tone: "opportunity",
  },
];
