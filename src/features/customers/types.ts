import type { AppRole } from "@/features/dashboard/types";

export type CustomerStatus =
  | "Active"
  | "New"
  | "Follow-up needed"
  | "Dormant";

export type CustomerPriority = "High" | "Medium" | "Low";

export type VisitHistoryStatus = "Completed" | "Missed" | "Cancelled";

export interface CustomerVisitHistory {
  id: string;
  date: string;
  status: VisitHistoryStatus;
  outcome: string;
  salesExecutive: string;
}

export type CustomerFollowUpStatus = "Open" | "Overdue";

export interface CustomerFollowUp {
  id: string;
  title: string;
  dueDate: string;
  priority: CustomerPriority;
  status: CustomerFollowUpStatus;
}

export interface DemoCustomer {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  territory: string;
  status: CustomerStatus;
  priority: CustomerPriority;
  assignedSalesExecutive: string;
  lastInteractionDate: string;
  nextFollowUpDate: string;
  notes: string;
  visitHistory: CustomerVisitHistory[];
  followUps: CustomerFollowUp[];
}

export interface CustomerPageContext {
  role: AppRole;
  roleLabel: string;
}
