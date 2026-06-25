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

export interface VisitPlanCustomerOption {
  id: string;
  companyName: string;
  territory: string;
}

export interface VisitPlanSalesExecutiveOption {
  id: string;
  displayName: string;
}

export interface VisitPlanningOptions {
  customers: VisitPlanCustomerOption[];
  salesExecutives: VisitPlanSalesExecutiveOption[];
}

export interface VisitPageContext {
  role: AppRole;
  roleLabel: string;
  isOrganizationAdmin?: boolean;
}

export interface VisitRecord {
  id: string;
  customerName: string;
  territory: string;
  assignedSalesExecutive: string;
  scheduledDate: string;
  scheduledTime: string;
  status: VisitStatus;
  priority: VisitPriority;
  planningNote: string | null;
  outcome: string | null;
  notes: string | null;
}

export type VisitWorkspaceResult =
  | {
      status: "ready";
      visits: VisitRecord[];
      today: string;
      planningOptions: VisitPlanningOptions | null;
    }
  | { status: "unavailable"; today: string };

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
