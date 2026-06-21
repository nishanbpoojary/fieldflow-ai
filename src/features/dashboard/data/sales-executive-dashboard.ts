import type {
  AssignedCustomer,
  DashboardKpi,
  PersonalPerformance,
  PlannedVisit,
  UpcomingTask,
} from "@/features/dashboard/types";

export const salesExecutiveKpis: DashboardKpi[] = [
  {
    id: "assigned-customers",
    label: "My Assigned Customers",
    value: "36",
    context: "Across Metro North",
    change: "4 need follow-up",
    tone: "blue",
  },
  {
    id: "todays-visits",
    label: "Today's Visits",
    value: "5",
    context: "2 completed, 3 remaining",
    change: "Next at 1:30 PM",
    tone: "violet",
  },
  {
    id: "follow-ups-today",
    label: "Follow-ups Due Today",
    value: "3",
    context: "Customer commitments due",
    change: "Before end of day",
    tone: "amber",
  },
  {
    id: "overdue-follow-ups",
    label: "Overdue Follow-ups",
    value: "2",
    context: "Both marked high priority",
    change: "Needs attention",
    tone: "rose",
  },
  {
    id: "completed-visits",
    label: "My Completed Visits",
    value: "18",
    context: "This month to date",
    change: "+4 this week",
    tone: "emerald",
  },
  {
    id: "completion-rate",
    label: "Personal Completion Rate",
    value: "82%",
    context: "18 of 22 planned visits",
    change: "+5% vs last month",
    tone: "blue",
  },
];

export const todaysPlannedVisits: PlannedVisit[] = [
  {
    id: "visit-1",
    customerName: "Northstar Motors",
    territory: "Metro North",
    scheduledTime: "9:00 AM",
    status: "Completed",
    priority: "High",
  },
  {
    id: "visit-2",
    customerName: "Juniper Auto House",
    territory: "Metro North",
    scheduledTime: "11:00 AM",
    status: "Completed",
    priority: "Standard",
  },
  {
    id: "visit-3",
    customerName: "Summit Drive Works",
    territory: "Metro North",
    scheduledTime: "1:30 PM",
    status: "Scheduled",
    priority: "High",
  },
  {
    id: "visit-4",
    customerName: "Silverline Mobility",
    territory: "Metro North",
    scheduledTime: "3:15 PM",
    status: "Scheduled",
    priority: "Standard",
  },
  {
    id: "visit-5",
    customerName: "Evergreen Fleet Co.",
    territory: "Metro North",
    scheduledTime: "4:45 PM",
    status: "Pending",
    priority: "Standard",
  },
];

export const assignedCustomers: AssignedCustomer[] = [
  {
    id: "customer-1",
    companyName: "Northstar Motors",
    territory: "Metro North",
    status: "Follow-up needed",
    nextFollowUp: "21 June 2026",
  },
  {
    id: "customer-2",
    companyName: "Summit Drive Works",
    territory: "Metro North",
    status: "Active",
    nextFollowUp: "23 June 2026",
  },
  {
    id: "customer-3",
    companyName: "Juniper Auto House",
    territory: "Metro North",
    status: "New",
    nextFollowUp: "24 June 2026",
  },
  {
    id: "customer-4",
    companyName: "Silverline Mobility",
    territory: "Metro North",
    status: "Active",
    nextFollowUp: "26 June 2026",
  },
];

export const upcomingTasks: UpcomingTask[] = [
  {
    id: "task-1",
    title: "Send revised fleet proposal",
    customerName: "Northstar Motors",
    dueDate: "Today, 2:00 PM",
    priority: "High",
  },
  {
    id: "task-2",
    title: "Confirm product demo attendees",
    customerName: "Summit Drive Works",
    dueDate: "Today, 5:00 PM",
    priority: "Medium",
  },
  {
    id: "task-3",
    title: "Prepare visit outcome notes",
    customerName: "Juniper Auto House",
    dueDate: "22 June 2026",
    priority: "Medium",
  },
  {
    id: "task-4",
    title: "Review renewal requirements",
    customerName: "Silverline Mobility",
    dueDate: "24 June 2026",
    priority: "Low",
  },
];

export const personalPerformance: PersonalPerformance = {
  plannedVisits: 22,
  completedVisits: 18,
  completionPercentage: 82,
  summary:
    "You are four visits away from your monthly plan and five percentage points ahead of last month's completion pace.",
};
