import type { AppRole } from "@/features/dashboard/types";

export type FollowUpStatus =
  | "overdue"
  | "due_today"
  | "upcoming"
  | "completed";

export type FollowUpPriority = "high" | "medium" | "low";

export interface DemoFollowUp {
  id: string;
  customerId: string;
  customerName: string;
  territory: string;
  assignedSalesExecutive: string;
  title: string;
  dueDate: string;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  planningNote?: string;
  completionNote?: string;
  completedDate?: string;
}

export interface FollowUpCustomerOption {
  id: string;
  companyName: string;
  territory: string;
  assignedSalesExecutive: string;
}

export interface FollowUpPageContext {
  role: AppRole;
  roleLabel: string;
}

export interface NewFollowUpInput {
  customerId: string;
  title: string;
  dueDate: string;
  priority: FollowUpPriority;
  planningNote?: string;
}
