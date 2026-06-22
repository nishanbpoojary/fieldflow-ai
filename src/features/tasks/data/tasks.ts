import "server-only";

import type { CurrentUser } from "@/lib/auth/current-user";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  TaskRecord,
  TaskStatus,
  TaskWorkspaceResult,
} from "@/features/tasks/types";

type TaskRow = Pick<
  Database["public"]["Tables"]["tasks"]["Row"],
  | "id"
  | "related_customer_id"
  | "assigned_sales_executive_id"
  | "title"
  | "due_date"
  | "priority"
  | "state"
  | "planning_note"
  | "completion_note"
  | "completed_at"
>;

const taskFields =
  "id, related_customer_id, assigned_sales_executive_id, title, due_date, priority, state, planning_note, completion_note, completed_at" as const;

const statusRank: Record<TaskStatus, number> = {
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

function classifyTask(
  state: Database["public"]["Enums"]["work_item_state"],
  dueDate: string,
  today: string,
): TaskStatus {
  if (state === "completed") return "completed";
  if (state === "cancelled") return "cancelled";
  if (dueDate < today) return "overdue";
  return dueDate === today ? "due_today" : "upcoming";
}

function sortTasks(tasks: TaskRecord[]) {
  return tasks.sort((first, second) => {
    const rankDifference = statusRank[first.status] - statusRank[second.status];
    return rankDifference || first.dueDate.localeCompare(second.dueDate);
  });
}

export async function getTaskWorkspace(
  currentUser: CurrentUser,
): Promise<TaskWorkspaceResult> {
  const today = getKolkataToday();

  try {
    const supabase = await createClient();
    let tasksQuery = supabase
      .from("tasks")
      .select(taskFields)
      .eq("team_id", currentUser.teamId);

    if (currentUser.role === "sales_executive") {
      tasksQuery = tasksQuery.eq(
        "assigned_sales_executive_id",
        currentUser.id,
      );
    }

    const tasksResult = await tasksQuery;

    if (tasksResult.error) {
      return { status: "unavailable", today };
    }

    const tasks: TaskRow[] = tasksResult.data;

    if (tasks.length === 0) {
      return { status: "ready", tasks: [], today };
    }

    const customerIds = unique(
      tasks.flatMap((task) =>
        task.related_customer_id ? [task.related_customer_id] : [],
      ),
    );

    let customers: Array<{
      id: string;
      company_name: string;
      territory_id: string;
    }> = [];

    if (customerIds.length > 0) {
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

      customers = customersResult.data;
    }

    const territoryIds = unique(
      customers.map((customer) => customer.territory_id),
    );
    const territoriesPromise =
      territoryIds.length > 0
        ? supabase
            .from("territories")
            .select("id, name")
            .eq("team_id", currentUser.teamId)
            .in("id", territoryIds)
        : null;

    const executiveIds = unique(
      tasks.map((task) => task.assigned_sales_executive_id),
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

    if (territoriesResult?.error || profilesResult?.error) {
      return { status: "unavailable", today };
    }

    const customerById = new Map(
      customers.map((customer) => [customer.id, customer]),
    );
    const territoryById = new Map(
      (territoriesResult?.data ?? []).map((territory) => [
        territory.id,
        territory.name,
      ]),
    );
    const executiveById = new Map(
      (profilesResult?.data ?? []).map((profile) => [
        profile.id,
        profile.display_name,
      ]),
    );

    const records = tasks.map((task): TaskRecord => {
      const customer = task.related_customer_id
        ? customerById.get(task.related_customer_id)
        : undefined;

      return {
        id: task.id,
        title: task.title,
        customerName: customer?.company_name ?? null,
        territory: customer
          ? territoryById.get(customer.territory_id) ?? null
          : null,
        assignedSalesExecutive:
          currentUser.role === "sales_executive"
            ? currentUser.displayName
            : executiveById.get(task.assigned_sales_executive_id) ??
              "Executive unavailable",
        dueDate: task.due_date,
        priority: task.priority,
        status: classifyTask(task.state, task.due_date, today),
        state: task.state,
        planningNote: task.planning_note,
        completionNote: task.completion_note,
        completedAt: task.completed_at,
      };
    });

    return { status: "ready", tasks: sortTasks(records), today };
  } catch {
    return { status: "unavailable", today };
  }
}
