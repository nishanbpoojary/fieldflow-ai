import "server-only";

import type { CurrentUser } from "@/lib/auth/current-user";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  FollowUpCreationOptions,
  FollowUpRecord,
  FollowUpStatus,
  FollowUpWorkspaceResult,
} from "@/features/follow-ups/types";

type FollowUpRow = Pick<
  Database["public"]["Tables"]["follow_ups"]["Row"],
  | "id"
  | "customer_id"
  | "assigned_sales_executive_id"
  | "title"
  | "due_date"
  | "priority"
  | "state"
  | "planning_note"
  | "completion_note"
  | "completed_at"
>;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const followUpFields =
  "id, customer_id, assigned_sales_executive_id, title, due_date, priority, state, planning_note, completion_note, completed_at" as const;

const statusRank: Record<FollowUpStatus, number> = {
  overdue: 0,
  due_today: 1,
  upcoming: 2,
  completed: 3,
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

function classifyFollowUp(
  state: Database["public"]["Enums"]["work_item_state"],
  dueDate: string,
  today: string,
): FollowUpStatus {
  if (state === "completed") return "completed";
  if (state === "cancelled") return "cancelled";
  if (dueDate < today) return "overdue";
  return dueDate === today ? "due_today" : "upcoming";
}

function sortFollowUps(followUps: FollowUpRecord[]) {
  return followUps.sort((first, second) => {
    const rankDifference = statusRank[first.status] - statusRank[second.status];
    return rankDifference || first.dueDate.localeCompare(second.dueDate);
  });
}

async function getManagerFollowUpCreationOptions(
  supabase: SupabaseServerClient,
  currentUser: CurrentUser,
): Promise<FollowUpCreationOptions | null> {
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

export async function getFollowUpWorkspace(
  currentUser: CurrentUser,
): Promise<FollowUpWorkspaceResult> {
  const today = getKolkataToday();

  try {
    const supabase = await createClient();
    const creationOptions = await getManagerFollowUpCreationOptions(
      supabase,
      currentUser,
    );

    if (currentUser.role === "manager" && creationOptions === null) {
      return { status: "unavailable", today };
    }

    let followUpsQuery = supabase
      .from("follow_ups")
      .select(followUpFields)
      .eq("team_id", currentUser.teamId);

    if (currentUser.role === "sales_executive") {
      followUpsQuery = followUpsQuery.eq(
        "assigned_sales_executive_id",
        currentUser.id,
      );
    }

    const followUpsResult = await followUpsQuery;

    if (followUpsResult.error) {
      return { status: "unavailable", today };
    }

    const followUps: FollowUpRow[] = followUpsResult.data;

    if (followUps.length === 0) {
      return { status: "ready", followUps: [], today, creationOptions };
    }

    const customerIds = unique(followUps.map((followUp) => followUp.customer_id));
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
    const territoriesPromise = supabase
      .from("territories")
      .select("id, name")
      .eq("team_id", currentUser.teamId)
      .in("id", territoryIds);

    const executiveIds = unique(
      followUps.map((followUp) => followUp.assigned_sales_executive_id),
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

    const [territoriesResult, profilesResult] = await Promise.all([
      territoriesPromise,
      profilesPromise,
    ]);

    if (territoriesResult.error || profilesResult?.error) {
      return { status: "unavailable", today };
    }

    const customerById = new Map(
      customersResult.data.map((customer) => [customer.id, customer]),
    );
    const territoryById = new Map(
      territoriesResult.data.map((territory) => [territory.id, territory.name]),
    );
    const executiveById = new Map(
      (profilesResult?.data ?? []).map((profile) => [
        profile.id,
        profile.display_name,
      ]),
    );

    const records = followUps.map((followUp): FollowUpRecord => {
      const customer = customerById.get(followUp.customer_id);

      return {
        id: followUp.id,
        customerName: customer?.company_name ?? "Customer unavailable",
        territory: customer
          ? territoryById.get(customer.territory_id) ?? "Territory unavailable"
          : "Territory unavailable",
        assignedSalesExecutive:
          currentUser.role === "sales_executive"
            ? currentUser.displayName
            : executiveById.get(followUp.assigned_sales_executive_id) ??
              "Executive unavailable",
        title: followUp.title,
        dueDate: followUp.due_date,
        status: classifyFollowUp(followUp.state, followUp.due_date, today),
        state: followUp.state,
        priority: followUp.priority,
        planningNote: followUp.planning_note,
        completionNote: followUp.completion_note,
        completedAt: followUp.completed_at,
      };
    });

    return {
      status: "ready",
      followUps: sortFollowUps(records),
      today,
      creationOptions,
    };
  } catch {
    return { status: "unavailable", today };
  }
}
