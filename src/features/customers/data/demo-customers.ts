import type { AppRole } from "@/features/dashboard/types";
import type {
  CustomerPageContext,
  DemoCustomer,
} from "@/features/customers/types";

export const demoCustomers: DemoCustomer[] = [
  {
    id: "northstar-motors",
    companyName: "Northstar Motors",
    contactPerson: "Elena Ward",
    phone: "+1 (202) 555-0101",
    email: "elena.ward@northstar.example",
    territory: "Metro North",
    status: "Follow-up needed",
    priority: "High",
    assignedSalesExecutive: "Maya Chen",
    lastInteractionDate: "18 June 2026",
    nextFollowUpDate: "21 June 2026",
    notes:
      "Reviewing a synthetic fleet expansion proposal. The customer asked for revised delivery assumptions and a concise ownership-cost summary.",
    visitHistory: [
      {
        id: "northstar-visit-1",
        date: "18 June 2026",
        status: "Completed",
        outcome: "Proposal review completed; pricing clarification requested.",
        salesExecutive: "Maya Chen",
      },
      {
        id: "northstar-visit-2",
        date: "4 June 2026",
        status: "Completed",
        outcome: "Fleet requirements and replacement timeline documented.",
        salesExecutive: "Maya Chen",
      },
    ],
    followUps: [
      {
        id: "northstar-follow-up-1",
        title: "Send revised fleet proposal",
        dueDate: "21 June 2026",
        priority: "High",
        status: "Overdue",
      },
      {
        id: "northstar-follow-up-2",
        title: "Confirm procurement review meeting",
        dueDate: "24 June 2026",
        priority: "Medium",
        status: "Open",
      },
    ],
  },
  {
    id: "juniper-auto-house",
    companyName: "Juniper Auto House",
    contactPerson: "Theo Bennett",
    phone: "+1 (202) 555-0102",
    email: "theo.bennett@juniper.example",
    territory: "Metro North",
    status: "New",
    priority: "Medium",
    assignedSalesExecutive: "Maya Chen",
    lastInteractionDate: "20 June 2026",
    nextFollowUpDate: "24 June 2026",
    notes:
      "New synthetic dealership account evaluating a compact commercial range. Product-fit discovery is still in progress.",
    visitHistory: [
      {
        id: "juniper-visit-1",
        date: "20 June 2026",
        status: "Completed",
        outcome: "Introductory meeting completed and buying criteria captured.",
        salesExecutive: "Maya Chen",
      },
      {
        id: "juniper-visit-2",
        date: "13 June 2026",
        status: "Cancelled",
        outcome: "Customer requested a new appointment because of a showroom event.",
        salesExecutive: "Maya Chen",
      },
    ],
    followUps: [
      {
        id: "juniper-follow-up-1",
        title: "Share compact range comparison",
        dueDate: "24 June 2026",
        priority: "Medium",
        status: "Open",
      },
    ],
  },
  {
    id: "summit-drive-works",
    companyName: "Summit Drive Works",
    contactPerson: "Priya Nair",
    phone: "+1 (202) 555-0103",
    email: "priya.nair@summitdrive.example",
    territory: "Metro North",
    status: "Active",
    priority: "High",
    assignedSalesExecutive: "Maya Chen",
    lastInteractionDate: "17 June 2026",
    nextFollowUpDate: "23 June 2026",
    notes:
      "Established synthetic account preparing for a quarterly product demonstration. Decision makers and vehicle categories are confirmed.",
    visitHistory: [
      {
        id: "summit-visit-1",
        date: "17 June 2026",
        status: "Completed",
        outcome: "Demonstration scope and attendee list agreed.",
        salesExecutive: "Maya Chen",
      },
      {
        id: "summit-visit-2",
        date: "28 May 2026",
        status: "Completed",
        outcome: "Quarterly requirements review completed.",
        salesExecutive: "Maya Chen",
      },
    ],
    followUps: [
      {
        id: "summit-follow-up-1",
        title: "Confirm demonstration attendees",
        dueDate: "23 June 2026",
        priority: "High",
        status: "Open",
      },
      {
        id: "summit-follow-up-2",
        title: "Prepare comparison handout",
        dueDate: "25 June 2026",
        priority: "Medium",
        status: "Open",
      },
    ],
  },
  {
    id: "silverline-mobility",
    companyName: "Silverline Mobility",
    contactPerson: "Marcus Lee",
    phone: "+1 (202) 555-0104",
    email: "marcus.lee@silverline.example",
    territory: "Metro North",
    status: "Active",
    priority: "Medium",
    assignedSalesExecutive: "Maya Chen",
    lastInteractionDate: "15 June 2026",
    nextFollowUpDate: "26 June 2026",
    notes:
      "Synthetic mobility services customer reviewing renewal options for a mixed-use fleet. Current relationship is stable.",
    visitHistory: [
      {
        id: "silverline-visit-1",
        date: "15 June 2026",
        status: "Completed",
        outcome: "Renewal priorities reviewed and usage summary requested.",
        salesExecutive: "Maya Chen",
      },
      {
        id: "silverline-visit-2",
        date: "30 May 2026",
        status: "Completed",
        outcome: "Service feedback recorded with no critical issues.",
        salesExecutive: "Maya Chen",
      },
    ],
    followUps: [
      {
        id: "silverline-follow-up-1",
        title: "Share renewal usage summary",
        dueDate: "26 June 2026",
        priority: "Medium",
        status: "Open",
      },
    ],
  },
  {
    id: "bluepeak-auto",
    companyName: "BluePeak Auto",
    contactPerson: "Nora Patel",
    phone: "+1 (202) 555-0105",
    email: "nora.patel@bluepeak.example",
    territory: "West Ridge",
    status: "Follow-up needed",
    priority: "High",
    assignedSalesExecutive: "Arjun Mehta",
    lastInteractionDate: "16 June 2026",
    nextFollowUpDate: "20 June 2026",
    notes:
      "Synthetic dealer group waiting for an updated financing illustration. A prompt response may protect the current opportunity.",
    visitHistory: [
      {
        id: "bluepeak-visit-1",
        date: "16 June 2026",
        status: "Completed",
        outcome: "Financing assumptions reviewed; updated illustration requested.",
        salesExecutive: "Arjun Mehta",
      },
      {
        id: "bluepeak-visit-2",
        date: "3 June 2026",
        status: "Missed",
        outcome: "Customer contact was unavailable; visit rescheduled.",
        salesExecutive: "Arjun Mehta",
      },
    ],
    followUps: [
      {
        id: "bluepeak-follow-up-1",
        title: "Send updated financing illustration",
        dueDate: "20 June 2026",
        priority: "High",
        status: "Overdue",
      },
    ],
  },
  {
    id: "horizon-fleet-works",
    companyName: "Horizon Fleet Works",
    contactPerson: "Caleb Stone",
    phone: "+1 (202) 555-0106",
    email: "caleb.stone@horizonfleet.example",
    territory: "Central Market",
    status: "Active",
    priority: "Medium",
    assignedSalesExecutive: "Leena Brooks",
    lastInteractionDate: "14 June 2026",
    nextFollowUpDate: "22 June 2026",
    notes:
      "Synthetic fleet workshop account with steady service demand. Interested in a scheduled maintenance package overview.",
    visitHistory: [
      {
        id: "horizon-visit-1",
        date: "14 June 2026",
        status: "Completed",
        outcome: "Maintenance package interest confirmed.",
        salesExecutive: "Leena Brooks",
      },
      {
        id: "horizon-visit-2",
        date: "1 June 2026",
        status: "Completed",
        outcome: "Operational review completed with positive feedback.",
        salesExecutive: "Leena Brooks",
      },
    ],
    followUps: [
      {
        id: "horizon-follow-up-1",
        title: "Send maintenance package overview",
        dueDate: "22 June 2026",
        priority: "Medium",
        status: "Open",
      },
    ],
  },
  {
    id: "cedarline-cars",
    companyName: "Cedarline Cars",
    contactPerson: "Aisha Grant",
    phone: "+1 (202) 555-0107",
    email: "aisha.grant@cedarline.example",
    territory: "South District",
    status: "Dormant",
    priority: "Low",
    assignedSalesExecutive: "Daniel Kim",
    lastInteractionDate: "29 May 2026",
    nextFollowUpDate: "27 June 2026",
    notes:
      "Synthetic account paused its expansion review. Maintain a light-touch relationship until the next planning cycle.",
    visitHistory: [
      {
        id: "cedarline-visit-1",
        date: "29 May 2026",
        status: "Completed",
        outcome: "Expansion decision deferred to the next quarter.",
        salesExecutive: "Daniel Kim",
      },
      {
        id: "cedarline-visit-2",
        date: "12 May 2026",
        status: "Cancelled",
        outcome: "Customer postponed because budget review was incomplete.",
        salesExecutive: "Daniel Kim",
      },
    ],
    followUps: [
      {
        id: "cedarline-follow-up-1",
        title: "Schedule quarterly relationship check-in",
        dueDate: "27 June 2026",
        priority: "Low",
        status: "Open",
      },
    ],
  },
  {
    id: "evergreen-fleet-co",
    companyName: "Evergreen Fleet Co.",
    contactPerson: "Jonah Reed",
    phone: "+1 (202) 555-0108",
    email: "jonah.reed@evergreenfleet.example",
    territory: "Metro North",
    status: "Active",
    priority: "Medium",
    assignedSalesExecutive: "Maya Chen",
    lastInteractionDate: "19 June 2026",
    nextFollowUpDate: "25 June 2026",
    notes:
      "Synthetic fleet customer comparing service coverage options. The next discussion should focus on uptime and support response targets.",
    visitHistory: [
      {
        id: "evergreen-visit-1",
        date: "19 June 2026",
        status: "Completed",
        outcome: "Support priorities and service coverage questions captured.",
        salesExecutive: "Maya Chen",
      },
      {
        id: "evergreen-visit-2",
        date: "6 June 2026",
        status: "Completed",
        outcome: "Fleet usage profile reviewed.",
        salesExecutive: "Maya Chen",
      },
    ],
    followUps: [
      {
        id: "evergreen-follow-up-1",
        title: "Share service coverage comparison",
        dueDate: "25 June 2026",
        priority: "Medium",
        status: "Open",
      },
    ],
  },
];

export function resolveCustomerDemoRole(
  role: string | string[] | undefined,
): CustomerPageContext {
  const resolvedRole: AppRole =
    role === "sales_executive" ? "sales_executive" : "manager";

  return {
    role: resolvedRole,
    roleLabel:
      resolvedRole === "sales_executive" ? "Sales Executive" : "Manager",
  };
}

export function getCustomersForRole(role: AppRole) {
  if (role === "sales_executive") {
    return demoCustomers.filter(
      (customer) => customer.assignedSalesExecutive === "Maya Chen",
    );
  }

  return demoCustomers;
}

export function getCustomerForRole(customerId: string, role: AppRole) {
  return getCustomersForRole(role).find((customer) => customer.id === customerId);
}
