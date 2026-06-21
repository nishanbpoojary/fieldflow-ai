import { demoCustomers } from "@/features/customers/data/demo-customers";
import type { AppRole } from "@/features/dashboard/types";
import type {
  DemoTask,
  TaskCustomerOption,
  TaskPageContext,
} from "@/features/tasks/types";

export const TASK_DEMO_TODAY = "2026-06-21";

export const taskCustomerOptions: TaskCustomerOption[] = demoCustomers.map(
  (customer) => ({
    id: customer.id,
    companyName: customer.companyName,
    territory: customer.territory,
    assignedSalesExecutive: customer.assignedSalesExecutive,
  }),
);

export const demoTasks: DemoTask[] = [
  {
    id: "task-northstar-proposal-check",
    title: "Review revised proposal figures",
    customerId: "northstar-motors",
    customerName: "Northstar Motors",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    dueDate: "2026-06-20",
    priority: "high",
    status: "overdue",
    planningNote: "Check delivery assumptions before sharing the final draft.",
  },
  {
    id: "task-juniper-product-brief",
    title: "Prepare compact range product brief",
    customerId: "juniper-auto-house",
    customerName: "Juniper Auto House",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    dueDate: TASK_DEMO_TODAY,
    priority: "medium",
    status: "due_today",
  },
  {
    id: "task-summit-demo-materials",
    title: "Assemble demonstration materials",
    customerId: "summit-drive-works",
    customerName: "Summit Drive Works",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    dueDate: "2026-06-23",
    priority: "high",
    status: "upcoming",
    planningNote: "Include the agreed vehicle categories and attendee agenda.",
  },
  {
    id: "task-silverline-renewal-summary",
    title: "Validate renewal usage summary",
    customerId: "silverline-mobility",
    customerName: "Silverline Mobility",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    dueDate: "2026-06-25",
    priority: "medium",
    status: "upcoming",
  },
  {
    id: "task-evergreen-coverage-notes",
    title: "Organize service coverage notes",
    customerId: "evergreen-fleet-co",
    customerName: "Evergreen Fleet Co.",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    dueDate: "2026-06-19",
    priority: "low",
    status: "completed",
    completionNote: "Consolidated uptime, support, and response-time requirements.",
    completedDate: "2026-06-19",
  },
  {
    id: "task-bluepeak-financing-review",
    title: "Verify financing illustration inputs",
    customerId: "bluepeak-auto",
    customerName: "BluePeak Auto",
    territory: "West Ridge",
    assignedSalesExecutive: "Arjun Mehta",
    dueDate: "2026-06-18",
    priority: "high",
    status: "overdue",
    planningNote: "Confirm the synthetic quarterly purchase volume.",
  },
  {
    id: "task-horizon-package-outline",
    title: "Draft maintenance package outline",
    customerId: "horizon-fleet-works",
    customerName: "Horizon Fleet Works",
    territory: "Central Market",
    assignedSalesExecutive: "Leena Brooks",
    dueDate: TASK_DEMO_TODAY,
    priority: "medium",
    status: "due_today",
  },
  {
    id: "task-cedarline-account-review",
    title: "Prepare quarterly account review",
    customerId: "cedarline-cars",
    customerName: "Cedarline Cars",
    territory: "South District",
    assignedSalesExecutive: "Daniel Kim",
    dueDate: "2026-06-27",
    priority: "low",
    status: "upcoming",
  },
  {
    id: "task-bluepeak-meeting-agenda",
    title: "Finalize financing review agenda",
    customerId: "bluepeak-auto",
    customerName: "BluePeak Auto",
    territory: "West Ridge",
    assignedSalesExecutive: "Arjun Mehta",
    dueDate: "2026-06-17",
    priority: "medium",
    status: "completed",
    completionNote: "Agenda shared with the synthetic finance and dealership contacts.",
    completedDate: "2026-06-17",
  },
  {
    id: "task-horizon-service-questions",
    title: "Categorize service coverage questions",
    customerId: "horizon-fleet-works",
    customerName: "Horizon Fleet Works",
    territory: "Central Market",
    assignedSalesExecutive: "Leena Brooks",
    dueDate: "2026-06-16",
    priority: "low",
    status: "completed",
    completionNote: "Grouped questions by scheduling, coverage, and response expectations.",
    completedDate: "2026-06-16",
  },
];

export function resolveTaskDemoRole(
  role: string | string[] | undefined,
): TaskPageContext {
  const resolvedRole: AppRole =
    role === "sales_executive" ? "sales_executive" : "manager";

  return {
    role: resolvedRole,
    roleLabel:
      resolvedRole === "sales_executive" ? "Sales Executive" : "Manager",
  };
}
