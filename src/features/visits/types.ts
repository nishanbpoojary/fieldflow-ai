import type { AppRole } from "@/features/dashboard/types";

export type VisitStatus = "pending" | "completed" | "missed" | "cancelled";
export type VisitPriority = "high" | "medium" | "low";

export interface DemoVisit {
  id: string;
  customerId: string;
  customerName: string;
  territory: string;
  assignedSalesExecutive: string;
  scheduledDate: string;
  scheduledTime: string;
  status: VisitStatus;
  priority: VisitPriority;
  planningNote?: string;
  outcome?: string;
  notes?: string;
}

export interface VisitCustomerOption {
  id: string;
  companyName: string;
  territory: string;
  assignedSalesExecutive: string;
}

export interface VisitPageContext {
  role: AppRole;
  roleLabel: string;
  roleQuery: string;
}

export interface NewVisitInput {
  customerId: string;
  assignedSalesExecutive: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: VisitPriority;
  planningNote?: string;
}

export interface VisitCompletionInput {
  outcome: string;
  notes: string;
}
