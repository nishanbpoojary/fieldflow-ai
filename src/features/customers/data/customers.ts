import "server-only";

import type { CurrentUser } from "@/lib/auth/current-user";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  CustomerDetailResult,
  CustomerDirectoryResult,
  CustomerPriority,
  CustomerRecord,
  CustomerStatus,
} from "@/features/customers/types";

const customerStatusLabels: Record<
  Database["public"]["Enums"]["customer_status"],
  CustomerStatus
> = {
  prospect: "Prospect",
  active: "Active",
  at_risk: "At risk",
  converted: "Converted",
  inactive: "Inactive",
};

const priorityLabels: Record<
  Database["public"]["Enums"]["priority_level"],
  CustomerPriority
> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CustomerRow = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  | "id"
  | "company_name"
  | "contact_name"
  | "contact_phone"
  | "contact_email"
  | "territory_id"
  | "assigned_sales_executive_id"
  | "status"
  | "priority"
  | "last_interaction_at"
  | "next_follow_up_date"
  | "notes"
>;

const customerFields =
  "id, company_name, contact_name, contact_phone, contact_email, territory_id, assigned_sales_executive_id, status, priority, last_interaction_at, next_follow_up_date, notes" as const;

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function formatTimestamp(value: string | null) {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function mapCustomer(
  customer: CustomerRow,
  territoryName: string,
  assignedExecutiveName: string,
): CustomerRecord {
  return {
    id: customer.id,
    companyName: customer.company_name,
    contactPerson: customer.contact_name ?? "Not provided",
    phone: customer.contact_phone ?? "Not provided",
    email: customer.contact_email ?? "Not provided",
    territory: territoryName,
    status: customerStatusLabels[customer.status],
    priority: priorityLabels[customer.priority],
    assignedSalesExecutive: assignedExecutiveName,
    lastInteractionDate: formatTimestamp(customer.last_interaction_at),
    nextFollowUpDate: formatDate(customer.next_follow_up_date),
    notes: customer.notes ?? "No account notes recorded.",
  };
}

export async function getCustomerDirectory(
  currentUser: CurrentUser,
): Promise<CustomerDirectoryResult> {
  try {
    const supabase = await createClient();
    let customerQuery = supabase
      .from("customers")
      .select(customerFields)
      .eq("team_id", currentUser.teamId)
      .order("company_name");

    if (currentUser.role === "sales_executive") {
      customerQuery = customerQuery.eq(
        "assigned_sales_executive_id",
        currentUser.id,
      );
    }

    const customersResult = await customerQuery;

    if (customersResult.error) {
      return { status: "unavailable" };
    }

    const customers = customersResult.data;

    if (customers.length === 0) {
      return { status: "ready", customers: [] };
    }

    const territoryIds = unique(
      customers.map((customer) => customer.territory_id),
    );
    const territoriesPromise = supabase
      .from("territories")
      .select("id, name")
      .eq("team_id", currentUser.teamId)
      .in("id", territoryIds);

    if (currentUser.role === "manager") {
      const executiveIds = unique(
        customers.map((customer) => customer.assigned_sales_executive_id),
      );
      const [territoriesResult, profilesResult] = await Promise.all([
        territoriesPromise,
        supabase
          .from("profiles")
          .select("id, display_name")
          .eq("team_id", currentUser.teamId)
          .eq("role", "sales_executive")
          .in("id", executiveIds),
      ]);

      if (territoriesResult.error || profilesResult.error) {
        return { status: "unavailable" };
      }

      const territoryById = new Map(
        territoriesResult.data.map((territory) => [territory.id, territory.name]),
      );
      const executiveById = new Map(
        profilesResult.data.map((profile) => [profile.id, profile.display_name]),
      );

      return {
        status: "ready",
        customers: customers.map((customer) =>
          mapCustomer(
            customer,
            territoryById.get(customer.territory_id) ?? "Territory unavailable",
            executiveById.get(customer.assigned_sales_executive_id) ??
              "Executive unavailable",
          ),
        ),
      };
    }

    const territoriesResult = await territoriesPromise;

    if (territoriesResult.error) {
      return { status: "unavailable" };
    }

    const territoryById = new Map(
      territoriesResult.data.map((territory) => [territory.id, territory.name]),
    );

    return {
      status: "ready",
      customers: customers.map((customer) =>
        mapCustomer(
          customer,
          territoryById.get(customer.territory_id) ?? "Territory unavailable",
          currentUser.displayName,
        ),
      ),
    };
  } catch {
    return { status: "unavailable" };
  }
}

export async function getCustomerDetail(
  currentUser: CurrentUser,
  customerId: string,
): Promise<CustomerDetailResult> {
  if (!uuidPattern.test(customerId)) {
    return { status: "not_found" };
  }

  try {
    const supabase = await createClient();
    let customerQuery = supabase
      .from("customers")
      .select(customerFields)
      .eq("id", customerId)
      .eq("team_id", currentUser.teamId);

    if (currentUser.role === "sales_executive") {
      customerQuery = customerQuery.eq(
        "assigned_sales_executive_id",
        currentUser.id,
      );
    }

    const customerResult = await customerQuery.maybeSingle();

    if (customerResult.error) {
      return { status: "unavailable" };
    }

    if (!customerResult.data) {
      return { status: "not_found" };
    }

    const customer = customerResult.data;
    const territoryPromise = supabase
      .from("territories")
      .select("name")
      .eq("id", customer.territory_id)
      .eq("team_id", currentUser.teamId)
      .maybeSingle();

    if (currentUser.role === "manager") {
      const [territoryResult, profileResult] = await Promise.all([
        territoryPromise,
        supabase
          .from("profiles")
          .select("display_name")
          .eq("id", customer.assigned_sales_executive_id)
          .eq("team_id", currentUser.teamId)
          .eq("role", "sales_executive")
          .maybeSingle(),
      ]);

      if (territoryResult.error || profileResult.error) {
        return { status: "unavailable" };
      }

      return {
        status: "ready",
        customer: mapCustomer(
          customer,
          territoryResult.data?.name ?? "Territory unavailable",
          profileResult.data?.display_name ?? "Executive unavailable",
        ),
      };
    }

    const territoryResult = await territoryPromise;

    if (territoryResult.error) {
      return { status: "unavailable" };
    }

    return {
      status: "ready",
      customer: mapCustomer(
        customer,
        territoryResult.data?.name ?? "Territory unavailable",
        currentUser.displayName,
      ),
    };
  } catch {
    return { status: "unavailable" };
  }
}
