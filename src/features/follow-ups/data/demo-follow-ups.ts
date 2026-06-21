import { demoCustomers } from "@/features/customers/data/demo-customers";
import type { AppRole } from "@/features/dashboard/types";
import type {
  DemoFollowUp,
  FollowUpCustomerOption,
  FollowUpPageContext,
} from "@/features/follow-ups/types";

export const FOLLOW_UP_DEMO_TODAY = "2026-06-21";

export const followUpCustomerOptions: FollowUpCustomerOption[] =
  demoCustomers.map((customer) => ({
    id: customer.id,
    companyName: customer.companyName,
    territory: customer.territory,
    assignedSalesExecutive: customer.assignedSalesExecutive,
  }));

export const demoFollowUps: DemoFollowUp[] = [
  {
    id: "follow-up-northstar-proposal",
    customerId: "northstar-motors",
    customerName: "Northstar Motors",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    title: "Send revised fleet proposal",
    dueDate: "2026-06-20",
    status: "overdue",
    priority: "high",
    planningNote: "Include the updated delivery assumptions and ownership-cost summary.",
  },
  {
    id: "follow-up-juniper-comparison",
    customerId: "juniper-auto-house",
    customerName: "Juniper Auto House",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    title: "Share compact range comparison",
    dueDate: FOLLOW_UP_DEMO_TODAY,
    status: "due_today",
    priority: "medium",
  },
  {
    id: "follow-up-summit-attendees",
    customerId: "summit-drive-works",
    customerName: "Summit Drive Works",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    title: "Confirm demonstration attendees",
    dueDate: "2026-06-23",
    status: "upcoming",
    priority: "high",
    planningNote: "Confirm the operations and procurement representatives.",
  },
  {
    id: "follow-up-silverline-usage",
    customerId: "silverline-mobility",
    customerName: "Silverline Mobility",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    title: "Share renewal usage summary",
    dueDate: "2026-06-26",
    status: "upcoming",
    priority: "medium",
  },
  {
    id: "follow-up-evergreen-coverage",
    customerId: "evergreen-fleet-co",
    customerName: "Evergreen Fleet Co.",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    title: "Send service coverage overview",
    dueDate: "2026-06-19",
    status: "completed",
    priority: "medium",
    completionNote: "Shared the comparison and highlighted response-time options.",
    completedDate: "2026-06-19",
  },
  {
    id: "follow-up-bluepeak-financing",
    customerId: "bluepeak-auto",
    customerName: "BluePeak Auto",
    territory: "West Ridge",
    assignedSalesExecutive: "Arjun Mehta",
    title: "Send updated financing illustration",
    dueDate: "2026-06-18",
    status: "overdue",
    priority: "high",
    planningNote: "Use the revised quarterly purchase assumptions.",
  },
  {
    id: "follow-up-horizon-maintenance",
    customerId: "horizon-fleet-works",
    customerName: "Horizon Fleet Works",
    territory: "Central Market",
    assignedSalesExecutive: "Leena Brooks",
    title: "Send maintenance package overview",
    dueDate: FOLLOW_UP_DEMO_TODAY,
    status: "due_today",
    priority: "medium",
  },
  {
    id: "follow-up-cedarline-check-in",
    customerId: "cedarline-cars",
    customerName: "Cedarline Cars",
    territory: "South District",
    assignedSalesExecutive: "Daniel Kim",
    title: "Schedule quarterly relationship check-in",
    dueDate: "2026-06-27",
    status: "upcoming",
    priority: "low",
  },
  {
    id: "follow-up-bluepeak-review",
    customerId: "bluepeak-auto",
    customerName: "BluePeak Auto",
    territory: "West Ridge",
    assignedSalesExecutive: "Arjun Mehta",
    title: "Confirm financing review participants",
    dueDate: "2026-06-17",
    status: "completed",
    priority: "medium",
    completionNote: "Confirmed the finance lead and dealership principal for the review.",
    completedDate: "2026-06-17",
  },
  {
    id: "follow-up-horizon-questions",
    customerId: "horizon-fleet-works",
    customerName: "Horizon Fleet Works",
    territory: "Central Market",
    assignedSalesExecutive: "Leena Brooks",
    title: "Capture maintenance coverage questions",
    dueDate: "2026-06-16",
    status: "completed",
    priority: "low",
    completionNote: "Recorded the synthetic account's coverage and scheduling questions.",
    completedDate: "2026-06-16",
  },
];

export function resolveFollowUpDemoRole(
  role: string | string[] | undefined,
): FollowUpPageContext {
  const resolvedRole: AppRole =
    role === "sales_executive" ? "sales_executive" : "manager";

  return {
    role: resolvedRole,
    roleLabel:
      resolvedRole === "sales_executive" ? "Sales Executive" : "Manager",
  };
}
