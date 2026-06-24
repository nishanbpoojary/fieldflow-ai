import "server-only";

import {
  buildMyPerformanceData,
  type MyPerformanceCustomerInput,
  type MyPerformanceTerritoryInput,
  type MyPerformanceVisitInput,
  type MyPerformanceVisitPlanInput,
  type MyPerformanceWorkItemInput,
} from "@/features/my-performance/data/my-performance-rules";
import type { MyPerformanceResult } from "@/features/my-performance/types";
import type { CurrentUser } from "@/lib/auth/current-user";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type VisitPlanStatus = Database["public"]["Enums"]["visit_plan_status"];
type WorkItemState = Database["public"]["Enums"]["work_item_state"];

const kolkataTimeZone = "Asia/Kolkata";

function getKolkataDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: kolkataTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");

  if (!year || !month || !day) {
    throw new Error("Unable to calculate the performance date.");
  }

  return `${year}-${month}-${day}`;
}

function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number) {
  const value = parseDateOnly(date);
  value.setUTCDate(value.getUTCDate() + days);
  return formatDateOnly(value);
}

function getReportingPeriod(today: string) {
  const date = parseDateOnly(today);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const weekStart = addDays(today, -mondayOffset);
  const weekEnd = addDays(weekStart, 6);
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = parseDateOnly(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  return {
    weekStart,
    weekEnd,
    monthStart,
    monthEndExclusive: formatDateOnly(monthEnd),
  };
}

function formatPeriodLabel(weekStart: string, weekEnd: string) {
  const start = parseDateOnly(weekStart);
  const end = parseDateOnly(weekEnd);
  const formatter = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function startOfKolkataDate(date: string) {
  return new Date(`${date}T00:00:00+05:30`).toISOString();
}

function toKolkataDate(timestamp: string) {
  return getKolkataDate(new Date(timestamp));
}

function minDate(first: string, second: string) {
  return first <= second ? first : second;
}

function maxDate(first: string, second: string) {
  return first >= second ? first : second;
}

export async function getMyPerformanceData(
  currentUser: CurrentUser,
): Promise<MyPerformanceResult> {
  const today = getKolkataDate();
  const period = getReportingPeriod(today);
  const periodLabel = formatPeriodLabel(period.weekStart, period.weekEnd);

  if (currentUser.role !== "sales_executive") {
    return { status: "unavailable", today, periodLabel };
  }

  try {
    const supabase = await createClient();
    const rangeStart = minDate(period.monthStart, period.weekStart);
    const rangeEndExclusive = maxDate(
      period.monthEndExclusive,
      addDays(period.weekEnd, 1),
    );
    const rangeEndInclusive = addDays(rangeEndExclusive, -1);
    const [
      customersResult,
      visitPlansResult,
      visitsResult,
      followUpsResult,
      tasksResult,
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("id, territory_id, assigned_sales_executive_id, status")
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id),
      supabase
        .from("visit_plans")
        .select("assigned_sales_executive_id, scheduled_date, status")
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id)
        .gte("scheduled_date", rangeStart)
        .lte("scheduled_date", rangeEndInclusive),
      supabase
        .from("visits")
        .select("assigned_sales_executive_id, completed_at")
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id)
        .gte("completed_at", startOfKolkataDate(rangeStart))
        .lt("completed_at", startOfKolkataDate(rangeEndExclusive)),
      supabase
        .from("follow_ups")
        .select("assigned_sales_executive_id, due_date, state")
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id)
        .eq("state", "open"),
      supabase
        .from("tasks")
        .select("assigned_sales_executive_id, due_date, state")
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id)
        .eq("state", "open"),
    ]);

    if (
      customersResult.error ||
      visitPlansResult.error ||
      visitsResult.error ||
      followUpsResult.error ||
      tasksResult.error
    ) {
      return { status: "unavailable", today, periodLabel };
    }

    const customers = customersResult.data;
    const visitPlans = visitPlansResult.data;
    const visits = visitsResult.data;
    const followUps = followUpsResult.data;
    const tasks = tasksResult.data;
    const hasAssignedData =
      customers.length > 0 ||
      visitPlans.length > 0 ||
      visits.length > 0 ||
      followUps.length > 0 ||
      tasks.length > 0;

    if (!hasAssignedData) {
      return { status: "empty", today, periodLabel };
    }

    const territoryIds = Array.from(
      new Set(customers.map((customer) => customer.territory_id)),
    );
    const territoriesResult =
      territoryIds.length > 0
        ? await supabase
            .from("territories")
            .select("id, name")
            .eq("team_id", currentUser.teamId)
            .in("id", territoryIds)
        : null;

    if (territoriesResult?.error) {
      return { status: "unavailable", today, periodLabel };
    }

    const territories: MyPerformanceTerritoryInput[] = (
      territoriesResult?.data ?? []
    ).map((territory) => ({
      id: territory.id,
      name: territory.name,
    }));
    const customerInputs: MyPerformanceCustomerInput[] = customers.map(
      (customer) => ({
        id: customer.id,
        territoryId: customer.territory_id,
        assignedSalesExecutiveId: customer.assigned_sales_executive_id,
        status: customer.status,
      }),
    );
    const visitPlanInputs: MyPerformanceVisitPlanInput[] = visitPlans.map(
      (plan) => ({
        assignedSalesExecutiveId: plan.assigned_sales_executive_id,
        scheduledDate: plan.scheduled_date,
        status: plan.status as VisitPlanStatus,
      }),
    );
    const visitInputs: MyPerformanceVisitInput[] = visits.map((visit) => ({
      assignedSalesExecutiveId: visit.assigned_sales_executive_id,
      completedDate: toKolkataDate(visit.completed_at),
    }));
    const followUpInputs: MyPerformanceWorkItemInput[] = followUps.map(
      (followUp) => ({
        assignedSalesExecutiveId: followUp.assigned_sales_executive_id,
        dueDate: followUp.due_date,
        state: followUp.state as WorkItemState,
      }),
    );
    const taskInputs: MyPerformanceWorkItemInput[] = tasks.map((task) => ({
      assignedSalesExecutiveId: task.assigned_sales_executive_id,
      dueDate: task.due_date,
      state: task.state as WorkItemState,
    }));

    return {
      status: "ready",
      data: buildMyPerformanceData({
        salesExecutiveId: currentUser.id,
        today,
        weekStart: period.weekStart,
        weekEnd: period.weekEnd,
        monthStart: period.monthStart,
        monthEndExclusive: period.monthEndExclusive,
        periodLabel,
        territories,
        customers: customerInputs,
        visitPlans: visitPlanInputs,
        visits: visitInputs,
        followUps: followUpInputs,
        tasks: taskInputs,
      }),
    };
  } catch {
    return { status: "unavailable", today, periodLabel };
  }
}
