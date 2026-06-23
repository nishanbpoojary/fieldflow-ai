import "server-only";

import {
  buildTerritoryWorkspaceData,
  type TerritoryCustomerInput,
  type TerritoryFollowUpInput,
  type TerritoryInput,
  type TerritoryTaskInput,
  type TerritoryVisitInput,
  type TerritoryVisitPlanInput,
} from "@/features/territories/data/territory-rules";
import type { TerritoryWorkspaceResult } from "@/features/territories/types";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type VisitPlanStatus = Database["public"]["Enums"]["visit_plan_status"];
type WorkItemState = Database["public"]["Enums"]["work_item_state"];

const kolkataTimeZone = "Asia/Kolkata";

function getKolkataDateString(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: kolkataTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseDateParts(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return { year, month, day };
}

function addDays(date: string, days: number) {
  const { year, month, day } = parseDateParts(date);
  const nextDate = new Date(Date.UTC(year, month - 1, day + days));

  return nextDate.toISOString().slice(0, 10);
}

function getWeekRange(today: string) {
  const { year, month, day } = parseDateParts(today);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = addDays(today, mondayOffset);
  const weekEnd = addDays(weekStart, 6);

  return { weekStart, weekEnd };
}

function formatDisplayDate(date: string) {
  const { year, month, day } = parseDateParts(date);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatPeriodLabel(weekStart: string, weekEnd: string) {
  return `${formatDisplayDate(weekStart)} - ${formatDisplayDate(weekEnd)}`;
}

function formatKolkataDateFromTimestamp(timestamp: string) {
  return getKolkataDateString(new Date(timestamp));
}

export async function getTerritoryWorkspaceData(
  currentUser: CurrentUser,
): Promise<TerritoryWorkspaceResult> {
  const today = getKolkataDateString();
  const { weekStart, weekEnd } = getWeekRange(today);
  const periodLabel = formatPeriodLabel(weekStart, weekEnd);

  if (currentUser.role !== "manager") {
    return { status: "unavailable", periodLabel, today };
  }

  const supabase = await createClient();
  const nextWeekStart = addDays(weekEnd, 1);

  const [
    territoriesResult,
    customersResult,
    visitPlansResult,
    visitsResult,
    followUpsResult,
    tasksResult,
  ] = await Promise.all([
    supabase
      .from("territories")
      .select("id, name")
      .eq("team_id", currentUser.teamId)
      .order("name", { ascending: true }),
    supabase
      .from("customers")
      .select("id, territory_id, assigned_sales_executive_id, status")
      .eq("team_id", currentUser.teamId),
    supabase
      .from("visit_plans")
      .select("customer_id, scheduled_date, status")
      .eq("team_id", currentUser.teamId)
      .gte("scheduled_date", weekStart)
      .lte("scheduled_date", weekEnd)
      .neq("status", "cancelled"),
    supabase
      .from("visits")
      .select("customer_id, completed_at")
      .eq("team_id", currentUser.teamId)
      .gte("completed_at", `${weekStart}T00:00:00+05:30`)
      .lt("completed_at", `${nextWeekStart}T00:00:00+05:30`),
    supabase
      .from("follow_ups")
      .select("customer_id, due_date, state")
      .eq("team_id", currentUser.teamId)
      .eq("state", "open")
      .lt("due_date", today),
    supabase
      .from("tasks")
      .select("related_customer_id, due_date, state")
      .eq("team_id", currentUser.teamId)
      .eq("state", "open")
      .lt("due_date", today)
      .not("related_customer_id", "is", null),
  ]);

  if (
    territoriesResult.error ||
    customersResult.error ||
    visitPlansResult.error ||
    visitsResult.error ||
    followUpsResult.error ||
    tasksResult.error
  ) {
    return { status: "unavailable", periodLabel, today };
  }

  const territories: TerritoryInput[] = territoriesResult.data.map(
    (territory) => ({
      id: territory.id,
      name: territory.name,
    }),
  );

  const customers: TerritoryCustomerInput[] = customersResult.data.map(
    (customer) => ({
      id: customer.id,
      territoryId: customer.territory_id,
      assignedSalesExecutiveId: customer.assigned_sales_executive_id,
      status: customer.status,
    }),
  );

  const visitPlans: TerritoryVisitPlanInput[] = visitPlansResult.data.map(
    (plan) => ({
      customerId: plan.customer_id,
      scheduledDate: plan.scheduled_date,
      status: plan.status as VisitPlanStatus,
    }),
  );

  const visits: TerritoryVisitInput[] = visitsResult.data.map((visit) => ({
    customerId: visit.customer_id,
    completedDate: formatKolkataDateFromTimestamp(visit.completed_at),
  }));

  const followUps: TerritoryFollowUpInput[] = followUpsResult.data.map(
    (followUp) => ({
      customerId: followUp.customer_id,
      dueDate: followUp.due_date,
      state: followUp.state as WorkItemState,
    }),
  );

  const tasks: TerritoryTaskInput[] = tasksResult.data.map((task) => ({
    relatedCustomerId: task.related_customer_id,
    dueDate: task.due_date,
    state: task.state as WorkItemState,
  }));

  return {
    status: "ready",
    data: buildTerritoryWorkspaceData({
      today,
      weekStart,
      weekEnd,
      periodLabel,
      territories,
      customers,
      visitPlans,
      visits,
      followUps,
      tasks,
    }),
  };
}

