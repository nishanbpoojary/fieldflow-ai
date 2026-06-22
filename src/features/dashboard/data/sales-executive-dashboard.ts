import "server-only";

import type { CurrentUser } from "@/lib/auth/current-user";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  AssignedCustomer,
  DashboardKpi,
  PersonalPerformance,
  PlannedVisit,
  SalesExecutiveDashboardData,
  SalesExecutiveDashboardResult,
  SalesPriorityItem,
  SalesPriorityStatus,
} from "@/features/dashboard/types";

const kolkataTimeZone = "Asia/Kolkata";

const customerStatusLabels: Record<
  Database["public"]["Enums"]["customer_status"],
  AssignedCustomer["status"]
> = {
  prospect: "Prospect",
  active: "Active",
  at_risk: "At risk",
  converted: "Converted",
  inactive: "Inactive",
};

const visitStatusLabels: Record<
  Database["public"]["Enums"]["visit_plan_status"],
  PlannedVisit["status"]
> = {
  pending: "Pending",
  completed: "Completed",
  missed: "Missed",
  cancelled: "Cancelled",
};

const priorityLabels: Record<
  Database["public"]["Enums"]["priority_level"],
  PlannedVisit["priority"]
> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const priorityRank: Record<
  Database["public"]["Enums"]["priority_level"],
  number
> = { high: 0, medium: 1, low: 2 };

const urgencyRank: Record<SalesPriorityStatus, number> = {
  Overdue: 0,
  "Due today": 1,
  Upcoming: 2,
};

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
    throw new Error("Unable to calculate the dashboard date.");
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

function formatScheduledTime(time: string) {
  const [hourValue, minuteValue] = time.split(":").map(Number);
  const suffix = hourValue >= 12 ? "PM" : "AM";
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minuteValue).padStart(2, "0")} ${suffix}`;
}

function classifyDueDate(dueDate: string, today: string): SalesPriorityStatus {
  if (dueDate < today) return "Overdue";
  return dueDate === today ? "Due today" : "Upcoming";
}

function calculatePercentage(completed: number, planned: number) {
  return planned === 0
    ? 0
    : Math.min(Math.round((completed / planned) * 100), 100);
}

export async function getSalesExecutiveDashboardData(
  currentUser: CurrentUser,
): Promise<SalesExecutiveDashboardResult> {
  const today = getKolkataDate();
  const period = getReportingPeriod(today);
  const periodLabel = formatPeriodLabel(period.weekStart, period.weekEnd);

  if (currentUser.role !== "sales_executive") {
    return { status: "unavailable", today, periodLabel };
  }

  try {
    const supabase = await createClient();
    const [
      customersResult,
      visitPlansResult,
      visitsResult,
      followUpsResult,
      tasksResult,
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("id, company_name, territory_id, status, next_follow_up_date")
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id),
      supabase
        .from("visit_plans")
        .select(
          "id, customer_id, scheduled_date, scheduled_time, status, priority",
        )
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id)
        .gte("scheduled_date", period.monthStart)
        .lt("scheduled_date", period.monthEndExclusive),
      supabase
        .from("visits")
        .select("completed_at")
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id)
        .gte("completed_at", startOfKolkataDate(period.monthStart))
        .lt("completed_at", startOfKolkataDate(period.monthEndExclusive)),
      supabase
        .from("follow_ups")
        .select("id, customer_id, title, due_date, priority, state")
        .eq("team_id", currentUser.teamId)
        .eq("assigned_sales_executive_id", currentUser.id)
        .eq("state", "open"),
      supabase
        .from("tasks")
        .select("id, related_customer_id, title, due_date, priority, state")
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

    const territoryById = new Map(
      (territoriesResult?.data ?? []).map((territory) => [
        territory.id,
        territory.name,
      ]),
    );
    const customerById = new Map(
      customers.map((customer) => [customer.id, customer]),
    );
    const todaysPlans = visitPlans
      .filter((plan) => plan.scheduled_date === today)
      .sort((first, second) =>
        first.scheduled_time.localeCompare(second.scheduled_time),
      );
    const completedToday = visits.filter(
      (visit) => toKolkataDate(visit.completed_at) === today,
    );
    const monthlyPlannedVisits = visitPlans.filter(
      (plan) => plan.status !== "cancelled",
    ).length;
    const monthlyCompletedVisits = visits.length;
    const completionPercentage = calculatePercentage(
      monthlyCompletedVisits,
      monthlyPlannedVisits,
    );
    const overdueFollowUps = followUps.filter(
      (followUp) => followUp.due_date < today,
    );
    const dueTodayFollowUps = followUps.filter(
      (followUp) => followUp.due_date === today,
    );
    const overdueTasks = tasks.filter((task) => task.due_date < today);
    const dueTodayTasks = tasks.filter((task) => task.due_date === today);
    const pendingToday = todaysPlans.filter(
      (plan) => plan.status === "pending",
    ).length;
    const completedPlansToday = todaysPlans.filter(
      (plan) => plan.status === "completed",
    ).length;

    const kpis: DashboardKpi[] = [
      {
        id: "assigned-customers",
        label: "My Assigned Customers",
        value: String(customers.length),
        context: `Across ${territoryIds.length} territor${territoryIds.length === 1 ? "y" : "ies"}`,
        change: `${customers.filter((customer) => customer.status === "at_risk").length} at risk`,
        tone: "blue",
      },
      {
        id: "todays-visits",
        label: "Today's Scheduled Visits",
        value: String(todaysPlans.length),
        context: `${completedPlansToday} completed, ${pendingToday} pending`,
        change: "Assigned schedule for today",
        tone: "violet",
      },
      {
        id: "completed-visits-today",
        label: "Completed Visits Today",
        value: String(completedToday.length),
        context: "Completed visit records today",
        change: `${monthlyCompletedVisits} month to date`,
        tone: "emerald",
      },
      {
        id: "open-follow-ups",
        label: "Open Follow-ups",
        value: String(followUps.length),
        context: `${dueTodayFollowUps.length} due today`,
        change: `${overdueFollowUps.length} overdue`,
        tone: overdueFollowUps.length > 0 ? "rose" : "amber",
      },
      {
        id: "open-tasks",
        label: "Open Tasks",
        value: String(tasks.length),
        context: `${dueTodayTasks.length} due today`,
        change: `${overdueTasks.length} overdue`,
        tone: overdueTasks.length > 0 ? "rose" : "amber",
      },
      {
        id: "completion-rate",
        label: "Personal Completion Rate",
        value: `${completionPercentage}%`,
        context: `${monthlyCompletedVisits} of ${monthlyPlannedVisits} planned visits`,
        change: "Current month in Asia/Kolkata",
        tone: "blue",
      },
    ];

    const todaysVisits: PlannedVisit[] = todaysPlans.map((plan) => {
      const customer = customerById.get(plan.customer_id);

      return {
        id: plan.id,
        customerName: customer?.company_name ?? "Customer unavailable",
        territory: customer
          ? territoryById.get(customer.territory_id) ?? "Territory unavailable"
          : "Territory unavailable",
        scheduledTime: formatScheduledTime(plan.scheduled_time),
        status: visitStatusLabels[plan.status],
        priority: priorityLabels[plan.priority],
      };
    });

    const assignedCustomers: AssignedCustomer[] = [...customers]
      .sort((first, second) => {
        if (!first.next_follow_up_date && !second.next_follow_up_date) return 0;
        if (!first.next_follow_up_date) return 1;
        if (!second.next_follow_up_date) return -1;
        return first.next_follow_up_date.localeCompare(
          second.next_follow_up_date,
        );
      })
      .slice(0, 5)
      .map((customer) => ({
        id: customer.id,
        companyName: customer.company_name,
        territory:
          territoryById.get(customer.territory_id) ?? "Territory unavailable",
        status: customerStatusLabels[customer.status],
        nextFollowUp: customer.next_follow_up_date,
      }));

    const priorities: SalesPriorityItem[] = [
      ...followUps.map((followUp) => {
        const customer = customerById.get(followUp.customer_id);
        return {
          id: `follow-up-${followUp.id}`,
          kind: "Follow-up" as const,
          title: followUp.title,
          customerName: customer?.company_name ?? null,
          territory: customer
            ? territoryById.get(customer.territory_id) ?? null
            : null,
          dueDate: followUp.due_date,
          priority: priorityLabels[followUp.priority],
          status: classifyDueDate(followUp.due_date, today),
          state: "Open" as const,
          priorityRank: priorityRank[followUp.priority],
        };
      }),
      ...tasks.map((task) => {
        const customer = task.related_customer_id
          ? customerById.get(task.related_customer_id)
          : undefined;
        return {
          id: `task-${task.id}`,
          kind: "Task" as const,
          title: task.title,
          customerName: customer?.company_name ?? null,
          territory: customer
            ? territoryById.get(customer.territory_id) ?? null
            : null,
          dueDate: task.due_date,
          priority: priorityLabels[task.priority],
          status: classifyDueDate(task.due_date, today),
          state: "Open" as const,
          priorityRank: priorityRank[task.priority],
        };
      }),
    ]
      .sort(
        (first, second) =>
          urgencyRank[first.status] - urgencyRank[second.status] ||
          first.dueDate.localeCompare(second.dueDate) ||
          first.priorityRank - second.priorityRank,
      )
      .slice(0, 6)
      .map((priority) => ({
        id: priority.id,
        kind: priority.kind,
        title: priority.title,
        customerName: priority.customerName,
        territory: priority.territory,
        dueDate: priority.dueDate,
        priority: priority.priority,
        status: priority.status,
        state: priority.state,
      }));

    const performance: PersonalPerformance = {
      plannedVisits: monthlyPlannedVisits,
      completedVisits: monthlyCompletedVisits,
      completionPercentage,
      summary:
        monthlyPlannedVisits === 0
          ? `${monthlyCompletedVisits} completed visit record${monthlyCompletedVisits === 1 ? " is" : "s are"} available this month, with no non-cancelled plans to compare.`
          : `${monthlyCompletedVisits} of ${monthlyPlannedVisits} non-cancelled planned visits are complete this month.`,
    };
    const nextPendingVisit = todaysVisits.find(
      (visit) => visit.status === "Pending",
    );
    const overdueWorkCount = overdueFollowUps.length + overdueTasks.length;
    const focus = {
      title: nextPendingVisit
        ? `Prepare for ${nextPendingVisit.customerName}`
        : overdueWorkCount > 0
          ? "Clear overdue assigned work"
          : "Keep today’s records current",
      detail: nextPendingVisit
        ? `Your next pending visit is at ${nextPendingVisit.scheduledTime} in ${nextPendingVisit.territory}. Review the customer context before departure.`
        : overdueWorkCount > 0
          ? `${overdueWorkCount} overdue follow-up or task item${overdueWorkCount === 1 ? " needs" : "s need"} attention.`
          : "There are no pending visits or overdue work items requiring immediate attention.",
      pendingVisits: pendingToday,
      overdueWork: overdueWorkCount,
    };
    const summary = `${completedToday.length} visit${completedToday.length === 1 ? " is" : "s are"} completed today, with ${pendingToday} pending. You have ${followUps.length + tasks.length} open follow-up and task item${followUps.length + tasks.length === 1 ? "" : "s"}, including ${overdueWorkCount} overdue.`;
    const data: SalesExecutiveDashboardData = {
      today,
      weekStart: period.weekStart,
      weekEnd: period.weekEnd,
      periodLabel,
      summary,
      kpis,
      todaysVisits,
      assignedCustomers,
      priorities,
      performance,
      focus,
    };

    return { status: "ready", data };
  } catch {
    return { status: "unavailable", today, periodLabel };
  }
}
