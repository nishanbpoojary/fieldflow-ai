import "server-only";

import type { CurrentUser } from "@/lib/auth/current-user";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  VisitPlanningOptions,
  VisitPriority,
  VisitRecord,
  VisitStatus,
  VisitWorkspaceResult,
} from "@/features/visits/types";

type VisitPlanRow = Pick<
  Database["public"]["Tables"]["visit_plans"]["Row"],
  | "id"
  | "customer_id"
  | "assigned_sales_executive_id"
  | "scheduled_date"
  | "scheduled_time"
  | "status"
  | "priority"
  | "planning_note"
>;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const visitPlanFields =
  "id, customer_id, assigned_sales_executive_id, scheduled_date, scheduled_time, status, priority, planning_note" as const;

const statusRank: Record<VisitStatus, number> = {
  pending: 1,
  completed: 2,
  missed: 3,
  cancelled: 4,
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function getKolkataToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valueByPart = new Map(parts.map((part) => [part.type, part.value]));

  return `${valueByPart.get("year")}-${valueByPart.get("month")}-${valueByPart.get("day")}`;
}

function sortVisits(visits: VisitRecord[], today: string) {
  return visits.sort((first, second) => {
    const firstRank =
      first.status === "pending" && first.scheduledDate === today
        ? 0
        : statusRank[first.status];
    const secondRank =
      second.status === "pending" && second.scheduledDate === today
        ? 0
        : statusRank[second.status];

    if (firstRank !== secondRank) return firstRank - secondRank;

    return `${first.scheduledDate}-${first.scheduledTime}`.localeCompare(
      `${second.scheduledDate}-${second.scheduledTime}`,
    );
  });
}

function mapPriority(
  priority: Database["public"]["Enums"]["priority_level"],
): VisitPriority {
  return priority;
}

function mapStatus(
  status: Database["public"]["Enums"]["visit_plan_status"],
): VisitStatus {
  return status;
}

async function getManagerVisitPlanningOptions(
  supabase: SupabaseServerClient,
  currentUser: CurrentUser,
): Promise<VisitPlanningOptions | null> {
  if (currentUser.role !== "manager") {
    return null;
  }

  const [customersResult, salesExecutivesResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, company_name, territory_id")
      .eq("team_id", currentUser.teamId)
      .order("company_name", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("team_id", currentUser.teamId)
      .eq("role", "sales_executive")
      .order("display_name", { ascending: true }),
  ]);

  if (customersResult.error || salesExecutivesResult.error) {
    return null;
  }

  const territoryIds = unique(
    customersResult.data.map((customer) => customer.territory_id),
  );

  let territoryById = new Map<string, string>();

  if (territoryIds.length > 0) {
    const territoriesResult = await supabase
      .from("territories")
      .select("id, name")
      .eq("team_id", currentUser.teamId)
      .in("id", territoryIds);

    if (territoriesResult.error) {
      return null;
    }

    territoryById = new Map(
      territoriesResult.data.map((territory) => [
        territory.id,
        territory.name,
      ]),
    );
  }

  return {
    customers: customersResult.data.map((customer) => ({
      id: customer.id,
      companyName: customer.company_name,
      territory:
        territoryById.get(customer.territory_id) ?? "Territory unavailable",
    })),
    salesExecutives: salesExecutivesResult.data.map((profile) => ({
      id: profile.id,
      displayName: profile.display_name,
    })),
  };
}

export async function getVisitWorkspace(
  currentUser: CurrentUser,
): Promise<VisitWorkspaceResult> {
  const today = getKolkataToday();

  try {
    const supabase = await createClient();
    const planningOptions = await getManagerVisitPlanningOptions(
      supabase,
      currentUser,
    );

    if (currentUser.role === "manager" && planningOptions === null) {
      return { status: "unavailable", today };
    }

    let visitPlansQuery = supabase
      .from("visit_plans")
      .select(visitPlanFields)
      .eq("team_id", currentUser.teamId);

    if (currentUser.role === "sales_executive") {
      visitPlansQuery = visitPlansQuery.eq(
        "assigned_sales_executive_id",
        currentUser.id,
      );
    }

    const visitPlansResult = await visitPlansQuery;

    if (visitPlansResult.error) {
      return { status: "unavailable", today };
    }

    const visitPlans: VisitPlanRow[] = visitPlansResult.data;

    if (visitPlans.length === 0) {
      return { status: "ready", visits: [], today, planningOptions };
    }

    const customerIds = unique(visitPlans.map((plan) => plan.customer_id));
    let customersQuery = supabase
      .from("customers")
      .select("id, company_name, territory_id")
      .eq("team_id", currentUser.teamId)
      .in("id", customerIds);

    if (currentUser.role === "sales_executive") {
      customersQuery = customersQuery.eq(
        "assigned_sales_executive_id",
        currentUser.id,
      );
    }

    const customersResult = await customersQuery;

    if (customersResult.error) {
      return { status: "unavailable", today };
    }

    const territoryIds = unique(
      customersResult.data.map((customer) => customer.territory_id),
    );
    const completedPlanIds = visitPlans
      .filter((plan) => plan.status === "completed")
      .map((plan) => plan.id);

    const territoriesPromise = supabase
      .from("territories")
      .select("id, name")
      .eq("team_id", currentUser.teamId)
      .in("id", territoryIds);

    let visitsPromise = null;
    if (completedPlanIds.length > 0) {
      let visitsQuery = supabase
        .from("visits")
        .select("visit_plan_id, outcome, notes")
        .eq("team_id", currentUser.teamId)
        .in("visit_plan_id", completedPlanIds);

      if (currentUser.role === "sales_executive") {
        visitsQuery = visitsQuery.eq(
          "assigned_sales_executive_id",
          currentUser.id,
        );
      }
      visitsPromise = visitsQuery;
    }

    const executiveIds = unique(
      visitPlans.map((plan) => plan.assigned_sales_executive_id),
    );
    const profilesPromise =
      currentUser.role === "manager"
        ? supabase
            .from("profiles")
            .select("id, display_name")
            .eq("team_id", currentUser.teamId)
            .eq("role", "sales_executive")
            .in("id", executiveIds)
        : null;

    const [territoriesResult, visitsResult, profilesResult] = await Promise.all([
      territoriesPromise,
      visitsPromise,
      profilesPromise,
    ]);

    if (
      territoriesResult.error ||
      visitsResult?.error ||
      profilesResult?.error
    ) {
      return { status: "unavailable", today };
    }

    const customerById = new Map(
      customersResult.data.map((customer) => [customer.id, customer]),
    );
    const territoryById = new Map(
      territoriesResult.data.map((territory) => [territory.id, territory.name]),
    );
    const visitByPlanId = new Map(
      (visitsResult?.data ?? [])
        .filter((visit) => visit.visit_plan_id !== null)
        .map((visit) => [visit.visit_plan_id as string, visit]),
    );
    const executiveById = new Map(
      (profilesResult?.data ?? []).map((profile) => [
        profile.id,
        profile.display_name,
      ]),
    );

    const visits = visitPlans.map((plan): VisitRecord => {
      const customer = customerById.get(plan.customer_id);
      const completedVisit = visitByPlanId.get(plan.id);

      return {
        id: plan.id,
        customerName: customer?.company_name ?? "Customer unavailable",
        territory: customer
          ? territoryById.get(customer.territory_id) ?? "Territory unavailable"
          : "Territory unavailable",
        assignedSalesExecutive:
          currentUser.role === "sales_executive"
            ? currentUser.displayName
            : executiveById.get(plan.assigned_sales_executive_id) ??
              "Executive unavailable",
        scheduledDate: plan.scheduled_date,
        scheduledTime: plan.scheduled_time,
        status: mapStatus(plan.status),
        priority: mapPriority(plan.priority),
        planningNote: plan.planning_note,
        outcome: completedVisit?.outcome ?? null,
        notes: completedVisit?.notes ?? null,
      };
    });

    return {
      status: "ready",
      visits: sortVisits(visits, today),
      today,
      planningOptions,
    };
  } catch {
    return { status: "unavailable", today };
  }
}
