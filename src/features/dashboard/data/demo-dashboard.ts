import type {
  DashboardNavigationItem,
} from "@/features/dashboard/types";

export const managerNavigation: DashboardNavigationItem[] = [
  { label: "Overview", shortLabel: "OV", active: true },
  { label: "Customers", shortLabel: "CU", active: false },
  { label: "Visits", shortLabel: "VI", active: false },
  { label: "Follow-ups", shortLabel: "FU", active: false },
  { label: "Tasks", shortLabel: "TA", active: false },
  { label: "Team Performance", shortLabel: "TP", active: false },
  { label: "Territories", shortLabel: "TE", active: false },
];

export const salesExecutiveNavigation: DashboardNavigationItem[] = [
  { label: "Overview", shortLabel: "OV", active: true },
  { label: "My Customers", shortLabel: "MC", active: false },
  { label: "Today's Visits", shortLabel: "TV", active: false },
  { label: "Follow-ups", shortLabel: "FU", active: false },
  { label: "Tasks", shortLabel: "TA", active: false },
  { label: "My Performance", shortLabel: "MP", active: false },
];
