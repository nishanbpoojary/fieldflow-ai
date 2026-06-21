import type { AppRole } from "@/features/dashboard/types";

export type TaskStatus = "overdue" | "due_today" | "upcoming" | "completed";
export type TaskPriority = "high" | "medium" | "low";

export interface DemoTask {
  id: string;
  title: string;
  customerId?: string;
  customerName?: string;
  territory: string;
  assignedSalesExecutive: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  planningNote?: string;
  completionNote?: string;
  completedDate?: string;
}

export interface TaskCustomerOption {
  id: string;
  companyName: string;
  territory: string;
  assignedSalesExecutive: string;
}

export interface TaskPageContext {
  role: AppRole;
  roleLabel: string;
}

export interface NewTaskInput {
  title: string;
  customerId: string;
  dueDate: string;
  priority: TaskPriority;
  planningNote?: string;
}
