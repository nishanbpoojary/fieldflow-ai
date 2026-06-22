import type { AppRole } from "@/features/dashboard/types";

export type FollowUpStatus =
  | "overdue"
  | "due_today"
  | "upcoming"
  | "cancelled"
  | "completed";

export type FollowUpPriority = "high" | "medium" | "low";

export interface FollowUpPageContext {
  role: AppRole;
  roleLabel: string;
}

export type FollowUpState = "open" | "completed" | "cancelled";

export interface FollowUpRecord {
  id: string;
  customerName: string;
  territory: string;
  assignedSalesExecutive: string;
  title: string;
  dueDate: string;
  status: FollowUpStatus;
  state: FollowUpState;
  priority: FollowUpPriority;
  planningNote: string | null;
  completionNote: string | null;
  completedAt: string | null;
}

export type FollowUpWorkspaceResult =
  | { status: "ready"; followUps: FollowUpRecord[]; today: string }
  | { status: "unavailable"; today: string };
