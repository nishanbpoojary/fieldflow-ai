import type { AppRole } from "@/features/dashboard/types";

export type TaskStatus =
  | "overdue"
  | "due_today"
  | "upcoming"
  | "completed"
  | "cancelled";
export type TaskPriority = "high" | "medium" | "low";
export type TaskState = "open" | "completed" | "cancelled";

export interface TaskRecord {
  id: string;
  title: string;
  customerName: string | null;
  territory: string | null;
  assignedSalesExecutive: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  state: TaskState;
  planningNote: string | null;
  completionNote: string | null;
  completedAt: string | null;
}

export interface TaskPageContext {
  role: AppRole;
  roleLabel: string;
  isOrganizationAdmin?: boolean;
}

export interface TaskCustomerOption {
  id: string;
  companyName: string;
  territory: string;
}

export interface TaskSalesExecutiveOption {
  id: string;
  displayName: string;
}

export interface TaskCreationOptions {
  customers: TaskCustomerOption[];
  salesExecutives: TaskSalesExecutiveOption[];
}

export type TaskWorkspaceResult =
  | {
      status: "ready";
      tasks: TaskRecord[];
      today: string;
      creationOptions: TaskCreationOptions | null;
    }
  | { status: "unavailable"; today: string };
