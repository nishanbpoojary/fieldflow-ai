import { demoCustomers } from "@/features/customers/data/demo-customers";
import type { AppRole } from "@/features/dashboard/types";
import type {
  DemoVisit,
  VisitCustomerOption,
  VisitPageContext,
} from "@/features/visits/types";

export const DEMO_TODAY = "2026-06-21";

export const visitCustomerOptions: VisitCustomerOption[] = demoCustomers.map(
  (customer) => ({
    id: customer.id,
    companyName: customer.companyName,
    territory: customer.territory,
    assignedSalesExecutive: customer.assignedSalesExecutive,
  }),
);

export const salesExecutives = [
  "Maya Chen",
  "Arjun Mehta",
  "Leena Brooks",
  "Daniel Kim",
] as const;

export const demoVisits: DemoVisit[] = [
  {
    id: "visit-northstar-0621",
    customerId: "northstar-motors",
    customerName: "Northstar Motors",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    scheduledDate: DEMO_TODAY,
    scheduledTime: "09:00",
    status: "completed",
    priority: "high",
    outcome: "Proposal requirements confirmed",
    notes: "Customer requested revised delivery assumptions before the next review.",
  },
  {
    id: "visit-juniper-0621",
    customerId: "juniper-auto-house",
    customerName: "Juniper Auto House",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    scheduledDate: DEMO_TODAY,
    scheduledTime: "11:00",
    status: "completed",
    priority: "medium",
    outcome: "Discovery meeting completed",
    notes: "Captured buying criteria for the compact commercial range.",
  },
  {
    id: "visit-summit-0621",
    customerId: "summit-drive-works",
    customerName: "Summit Drive Works",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    scheduledDate: DEMO_TODAY,
    scheduledTime: "13:30",
    status: "pending",
    priority: "high",
    planningNote: "Confirm product demonstration attendees.",
  },
  {
    id: "visit-silverline-0621",
    customerId: "silverline-mobility",
    customerName: "Silverline Mobility",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    scheduledDate: DEMO_TODAY,
    scheduledTime: "15:15",
    status: "pending",
    priority: "medium",
    planningNote: "Review renewal service coverage options.",
  },
  {
    id: "visit-evergreen-0621",
    customerId: "evergreen-fleet-co",
    customerName: "Evergreen Fleet Co.",
    territory: "Metro North",
    assignedSalesExecutive: "Maya Chen",
    scheduledDate: DEMO_TODAY,
    scheduledTime: "16:45",
    status: "cancelled",
    priority: "low",
    notes: "Customer requested a new date because the operations lead is unavailable.",
  },
  {
    id: "visit-bluepeak-0621",
    customerId: "bluepeak-auto",
    customerName: "BluePeak Auto",
    territory: "West Ridge",
    assignedSalesExecutive: "Arjun Mehta",
    scheduledDate: DEMO_TODAY,
    scheduledTime: "10:30",
    status: "pending",
    priority: "high",
    planningNote: "Bring the updated financing illustration.",
  },
  {
    id: "visit-horizon-0621",
    customerId: "horizon-fleet-works",
    customerName: "Horizon Fleet Works",
    territory: "Central Market",
    assignedSalesExecutive: "Leena Brooks",
    scheduledDate: DEMO_TODAY,
    scheduledTime: "12:00",
    status: "completed",
    priority: "medium",
    outcome: "Maintenance package interest confirmed",
    notes: "Send the synthetic coverage comparison during the next workflow step.",
  },
  {
    id: "visit-cedarline-0621",
    customerId: "cedarline-cars",
    customerName: "Cedarline Cars",
    territory: "South District",
    assignedSalesExecutive: "Daniel Kim",
    scheduledDate: DEMO_TODAY,
    scheduledTime: "14:00",
    status: "missed",
    priority: "low",
    notes: "Customer contact was unavailable at the scheduled time.",
  },
  {
    id: "visit-bluepeak-0622",
    customerId: "bluepeak-auto",
    customerName: "BluePeak Auto",
    territory: "West Ridge",
    assignedSalesExecutive: "Arjun Mehta",
    scheduledDate: "2026-06-22",
    scheduledTime: "09:30",
    status: "pending",
    priority: "medium",
    planningNote: "Review the next-quarter purchase timeline.",
  },
];

export function resolveVisitDemoRole(
  role: string | string[] | undefined,
): VisitPageContext {
  const resolvedRole: AppRole =
    role === "sales_executive" ? "sales_executive" : "manager";

  return {
    role: resolvedRole,
    roleLabel:
      resolvedRole === "sales_executive" ? "Sales Executive" : "Manager",
  };
}
