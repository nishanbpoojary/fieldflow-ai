import "server-only";

import type { CurrentUser } from "@/lib/auth/current-user";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type {
  CustomerStatusChartPoint,
  DashboardKpi,
  FollowUpPriority,
  ManagerDashboardData,
  ManagerDashboardResult,
  ManagerPriority,
  TeamPerformanceMember,
  VisitComparisonChartPoint,
} from "@/features/dashboard/types";

const kolkataTimeZone = "Asia/Kolkata";

const customerStatusPresentation: Record<
  Database["public"]["Enums"]["customer_status"],
  { label: string; fill: string }
> = {
  prospect: { label: "Prospect", fill: "#0ea5e9" },
  active: { label: "Active", fill: "#2563eb" },
  at_risk: { label: "At risk", fill: "#f59e0b" },
  converted: { label: "Converted", fill: "#10b981" },
  inactive: { label: "Inactive", fill: "#94a3b8" },
};

const priorityLabels: Record<
  Database["public"]["Enums"]["priority_level"],
  FollowUpPriority
> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function getKolkataDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: kolkataTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to calculate the reporting date.");
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
  const todayDate = parseDateOnly(today);
  const mondayOffset = (todayDate.getUTCDay() + 6) % 7;
  const weekStart = addDays(today, -mondayOffset);
  const weekEnd = addDays(weekStart, 6);
  const weekEndExclusive = addDays(weekEnd, 1);
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEndDate = parseDateOnly(monthStart);
  monthEndDate.setUTCMonth(monthEndDate.getUTCMonth() + 1);
  const monthEndExclusive = formatDateOnly(monthEndDate);

  return {
    weekStart,
    weekEnd,
    weekEndExclusive,
    monthStart,
    monthEndExclusive,
  };
}

function startOfKolkataDate(date: string) {
  return new Date(`${date}T00:00:00+05:30`).toISOString();
}

function toKolkataDate(timestamp: string) {
  return getKolkataDate(new Date(timestamp));
}

function formatPeriodLabel(weekStart: string, weekEnd: string) {
  const start = parseDateOnly(weekStart);
  const end = parseDateOnly(weekEnd);
  const startMonth = start.getUTCMonth();
  const endMonth = end.getUTCMonth();
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const monthFormatter = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    timeZone: "UTC",
  });

  if (startMonth === endMonth && startYear === endYear) {
    return `Week of ${startDay}-${endDay} ${monthFormatter.format(end)} ${endYear}`;
  }

  return `Week of ${startDay} ${monthFormatter.format(start)}-${endDay} ${monthFormatter.format(end)} ${endYear}`;
}

function calculatePercentage(completed: number, planned: number) {
  return planned === 0
    ? 0
    : Math.min(Math.round((completed / planned) * 100), 100);
}

function incrementCount(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function formatOverdueStatus(dueDate: string, today: string) {
  const millisecondsPerDay = 86_400_000;
  const daysOverdue = Math.round(
    (parseDateOnly(today).getTime() - parseDateOnly(dueDate).getTime()) /
      millisecondsPerDay,
  );

  return daysOverdue === 1 ? "1 day overdue" : `${daysOverdue} days overdue`;
}

function buildManagerPriorities({
  overdueCount,
  highPriorityOverdueCount,
  plannedVisits,
  completedVisits,
  hasMonthlyTarget,
  monthlyCompletedVisits,
  monthlyCompletionPercentage,
  monthlyTargetCompletions,
}: {
  overdueCount: number;
  highPriorityOverdueCount: number;
  plannedVisits: number;
  completedVisits: number;
  hasMonthlyTarget: boolean;
  monthlyCompletedVisits: number;
  monthlyCompletionPercentage: number;
  monthlyTargetCompletions: number;
}): ManagerPriority[] {
  const priorities: ManagerPriority[] = [];

  if (overdueCount > 0) {
    priorities.push({
      id: "overdue-follow-ups",
      label: "Clear overdue follow-ups",
      detail: `${overdueCount} open customer commitment${overdueCount === 1 ? " is" : "s are"} overdue, including ${highPriorityOverdueCount} high-priority item${highPriorityOverdueCount === 1 ? "" : "s"}.`,
      action: "Review ownership and agree the next customer contact.",
      tone: "critical",
    });
  }

  const visitGap = Math.max(plannedVisits - completedVisits, 0);
  priorities.push({
    id: "weekly-visits",
    label:
      visitGap > 0 ? "Close the weekly visit gap" : "Protect weekly execution",
    detail:
      plannedVisits === 0
        ? "No non-cancelled visits are planned for the current week."
        : `${completedVisits} of ${plannedVisits} weekly planned visits are complete, leaving a gap of ${visitGap}.`,
    action:
      visitGap > 0
        ? "Confirm the remaining schedules with the team."
        : "Keep completed visit outcomes and follow-ups current.",
    tone: visitGap > 0 ? "attention" : "opportunity",
  });

  priorities.push({
    id: "monthly-target",
    label:
      hasMonthlyTarget
        ? "Track monthly target progress"
        : "Confirm monthly completion targets",
    detail:
      hasMonthlyTarget
        ? monthlyTargetCompletions === 0
          ? `The selected target is 0 completions; ${monthlyCompletedVisits} matching visit${monthlyCompletedVisits === 1 ? " is" : "s are"} recorded this month at a safe 0% target rate.`
          : `${monthlyCompletedVisits} of ${monthlyTargetCompletions} targeted visit completions are recorded this month (${monthlyCompletionPercentage}%).`
        : "No completion target is available for the current month.",
    action:
      hasMonthlyTarget
        ? "Use the remaining target gap to guide weekly planning."
        : "Review target coverage for the active sales team.",
    tone: "opportunity",
  });

  return priorities;
}

export async function getManagerDashboardData(
  currentUser: CurrentUser,
): Promise<ManagerDashboardResult> {
  const today = getKolkataDate();
  const period = getReportingPeriod(today);
  const periodLabel = formatPeriodLabel(period.weekStart, period.weekEnd);

  if (currentUser.role !== "manager") {
    return { status: "unavailable", periodLabel, today };
  }

  try {
    return await loadManagerDashboardData(
      currentUser,
      today,
      period,
      periodLabel,
    );
  } catch {
    return { status: "unavailable", periodLabel, today };
  }
}

async function loadManagerDashboardData(
  currentUser: CurrentUser,
  today: string,
  period: ReturnType<typeof getReportingPeriod>,
  periodLabel: string,
): Promise<ManagerDashboardResult> {
  const supabase = await createClient();
  const visitRangeStart =
    period.weekStart < period.monthStart ? period.weekStart : period.monthStart;
  const visitRangeEnd =
    period.weekEndExclusive > period.monthEndExclusive
      ? period.weekEndExclusive
      : period.monthEndExclusive;

  const [
    customersResult,
    territoriesResult,
    profilesResult,
    visitPlansResult,
    visitsResult,
    followUpsResult,
    monthlyTargetsResult,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, company_name, territory_id, assigned_sales_executive_id, status",
      )
      .eq("team_id", currentUser.teamId),
    supabase
      .from("territories")
      .select("id, name")
      .eq("team_id", currentUser.teamId)
      .order("name"),
    supabase
      .from("profiles")
      .select("id, display_name")
      .eq("team_id", currentUser.teamId)
      .eq("role", "sales_executive")
      .order("display_name"),
    supabase
      .from("visit_plans")
      .select("customer_id, assigned_sales_executive_id, scheduled_date")
      .eq("team_id", currentUser.teamId)
      .gte("scheduled_date", period.weekStart)
      .lte("scheduled_date", period.weekEnd)
      .neq("status", "cancelled"),
    supabase
      .from("visits")
      .select("customer_id, assigned_sales_executive_id, completed_at")
      .eq("team_id", currentUser.teamId)
      .gte("completed_at", startOfKolkataDate(visitRangeStart))
      .lt("completed_at", startOfKolkataDate(visitRangeEnd)),
    supabase
      .from("follow_ups")
      .select(
        "id, customer_id, assigned_sales_executive_id, due_date, priority",
      )
      .eq("team_id", currentUser.teamId)
      .eq("state", "open")
      .lt("due_date", today)
      .order("due_date"),
    supabase
      .from("monthly_targets")
      .select("sales_executive_id, territory_id, target_completions")
      .eq("team_id", currentUser.teamId)
      .eq("target_month", period.monthStart),
  ]);

  if (
    customersResult.error ||
    territoriesResult.error ||
    profilesResult.error ||
    visitPlansResult.error ||
    visitsResult.error ||
    followUpsResult.error ||
    monthlyTargetsResult.error
  ) {
    return { status: "unavailable", periodLabel, today };
  }

  const customers = customersResult.data;
  const territories = territoriesResult.data;
  const profiles = profilesResult.data;
  const visitPlans = visitPlansResult.data;
  const visits = visitsResult.data;
  const followUps = followUpsResult.data;
  const monthlyTargets = monthlyTargetsResult.data;
  const hasOperationalData =
    customers.length > 0 ||
    visitPlans.length > 0 ||
    visits.length > 0 ||
    followUps.length > 0 ||
    monthlyTargets.length > 0;

  if (!hasOperationalData) {
    return { status: "empty", periodLabel, today };
  }

  const customerById = new Map(
    customers.map((customer) => [customer.id, customer]),
  );
  const territoryById = new Map(
    territories.map((territory) => [territory.id, territory.name]),
  );
  const profileById = new Map(
    profiles.map((profile) => [profile.id, profile.display_name]),
  );
  const weeklyVisits = visits.filter((visit) => {
    const completedDate = toKolkataDate(visit.completed_at);
    return completedDate >= period.weekStart && completedDate <= period.weekEnd;
  });
  const monthlyVisits = visits.filter((visit) => {
    const completedDate = toKolkataDate(visit.completed_at);
    return (
      completedDate >= period.monthStart &&
      completedDate < period.monthEndExclusive
    );
  });
  const convertedCustomers = customers.filter(
    (customer) => customer.status === "converted",
  ).length;
  const conversionRate =
    customers.length === 0
      ? 0
      : Math.round((convertedCustomers / customers.length) * 1_000) / 10;
  const highPriorityOverdueCount = followUps.filter(
    (followUp) => followUp.priority === "high",
  ).length;
  const monthlyTargetsByExecutive = new Map<string, typeof monthlyTargets>();
  monthlyTargets.forEach((target) => {
    const executiveTargets =
      monthlyTargetsByExecutive.get(target.sales_executive_id) ?? [];
    executiveTargets.push(target);
    monthlyTargetsByExecutive.set(target.sales_executive_id, executiveTargets);
  });
  const selectedMonthlyTargets = Array.from(
    monthlyTargetsByExecutive.values(),
  ).flatMap((executiveTargets) => {
    const overallTarget = executiveTargets.find(
      (target) => target.territory_id === null,
    );

    return overallTarget ? [overallTarget] : executiveTargets;
  });
  const hasMonthlyTarget = selectedMonthlyTargets.length > 0;
  const monthlyTargetCompletions = selectedMonthlyTargets.reduce(
    (total, target) => total + target.target_completions,
    0,
  );
  const executivesWithOverallTargets = new Set(
    selectedMonthlyTargets
      .filter((target) => target.territory_id === null)
      .map((target) => target.sales_executive_id),
  );
  const selectedTerritoriesByExecutive = new Map<string, Set<string>>();
  selectedMonthlyTargets.forEach((target) => {
    if (target.territory_id === null) return;

    const selectedTerritories =
      selectedTerritoriesByExecutive.get(target.sales_executive_id) ??
      new Set<string>();
    selectedTerritories.add(target.territory_id);
    selectedTerritoriesByExecutive.set(
      target.sales_executive_id,
      selectedTerritories,
    );
  });
  const monthlyTargetVisits = monthlyVisits.filter((visit) => {
    if (executivesWithOverallTargets.has(visit.assigned_sales_executive_id)) {
      return true;
    }

    const selectedTerritories = selectedTerritoriesByExecutive.get(
      visit.assigned_sales_executive_id,
    );
    const customerTerritoryId = customerById.get(
      visit.customer_id,
    )?.territory_id;

    return Boolean(
      selectedTerritories &&
        customerTerritoryId &&
        selectedTerritories.has(customerTerritoryId),
    );
  });
  const monthlyCompletionPercentage =
    monthlyTargetCompletions === 0
      ? 0
      : Math.min(
          Math.round(
            (monthlyTargetVisits.length / monthlyTargetCompletions) * 100,
          ),
          100,
        );
  const weeklyCompletionPercentage = calculatePercentage(
    weeklyVisits.length,
    visitPlans.length,
  );
  const plannedToday = visitPlans.filter(
    (visitPlan) => visitPlan.scheduled_date === today,
  ).length;

  const kpis: DashboardKpi[] = [
    {
      id: "total-customers",
      label: "Total Customers",
      value: String(customers.length),
      context: `Across ${territories.length} team territor${territories.length === 1 ? "y" : "ies"}`,
      change: `${convertedCustomers} converted`,
      tone: "blue",
    },
    {
      id: "planned-visits",
      label: "Planned Visits",
      value: String(visitPlans.length),
      context: "Non-cancelled plans this week",
      change: `${plannedToday} scheduled today`,
      tone: "violet",
    },
    {
      id: "completed-visits",
      label: "Completed Visits",
      value: String(weeklyVisits.length),
      context: `${weeklyCompletionPercentage}% of weekly plans`,
      change:
        hasMonthlyTarget
          ? monthlyTargetCompletions === 0
            ? `0% · ${monthlyTargetVisits.length} completed against target 0`
            : `${monthlyCompletionPercentage}% · ${monthlyTargetVisits.length} of ${monthlyTargetCompletions} monthly target`
          : "No monthly target available",
      tone: "emerald",
    },
    {
      id: "overdue-follow-ups",
      label: "Overdue Follow-ups",
      value: String(followUps.length),
      context: "Open items due before today",
      change: `${highPriorityOverdueCount} high priority`,
      tone: "rose",
    },
    {
      id: "conversion-rate",
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      context: "Converted customers out of all customers",
      change: `${convertedCustomers} converted accounts`,
      tone: "amber",
    },
  ];

  const overdueFollowUps = followUps.map((followUp) => {
    const customer = customerById.get(followUp.customer_id);

    return {
      id: followUp.id,
      customerName: customer?.company_name ?? "Customer unavailable",
      territory: customer
        ? (territoryById.get(customer.territory_id) ?? "Territory unavailable")
        : "Territory unavailable",
      priority: priorityLabels[followUp.priority],
      dueStatus: formatOverdueStatus(followUp.due_date, today),
      assignedExecutive:
        profileById.get(followUp.assigned_sales_executive_id) ??
        "Executive unavailable",
    };
  });

  const plannedByExecutive = new Map<string, number>();
  const completedByExecutive = new Map<string, number>();
  const territoriesByExecutive = new Map<string, Set<string>>();

  visitPlans.forEach((visitPlan) => {
    incrementCount(plannedByExecutive, visitPlan.assigned_sales_executive_id);
  });
  weeklyVisits.forEach((visit) => {
    incrementCount(completedByExecutive, visit.assigned_sales_executive_id);
  });
  customers.forEach((customer) => {
    const territoryName = territoryById.get(customer.territory_id);
    if (!territoryName) return;
    const assignedTerritories =
      territoriesByExecutive.get(customer.assigned_sales_executive_id) ??
      new Set<string>();
    assignedTerritories.add(territoryName);
    territoriesByExecutive.set(
      customer.assigned_sales_executive_id,
      assignedTerritories,
    );
  });

  const teamPerformance: TeamPerformanceMember[] = profiles.map((profile) => {
    const plannedVisits = plannedByExecutive.get(profile.id) ?? 0;
    const completedVisits = completedByExecutive.get(profile.id) ?? 0;
    const assignedTerritories = Array.from(
      territoriesByExecutive.get(profile.id) ?? [],
    );

    return {
      id: profile.id,
      name: profile.display_name,
      territory:
        assignedTerritories.length > 0
          ? assignedTerritories.join(", ")
          : "No assigned territory",
      plannedVisits,
      completedVisits,
      completionPercentage: calculatePercentage(completedVisits, plannedVisits),
    };
  });
  const executiveVisitChartData: VisitComparisonChartPoint[] =
    teamPerformance.map((member) => ({
      label: member.name,
      plannedVisits: member.plannedVisits,
      completedVisits: member.completedVisits,
    }));

  const plannedByTerritory = new Map<string, number>();
  const completedByTerritory = new Map<string, number>();

  visitPlans.forEach((visitPlan) => {
    const territoryId = customerById.get(visitPlan.customer_id)?.territory_id;
    if (territoryId) incrementCount(plannedByTerritory, territoryId);
  });
  weeklyVisits.forEach((visit) => {
    const territoryId = customerById.get(visit.customer_id)?.territory_id;
    if (territoryId) incrementCount(completedByTerritory, territoryId);
  });

  const territoryVisitChartData: VisitComparisonChartPoint[] = territories.map(
    (territory) => ({
      label: territory.name,
      plannedVisits: plannedByTerritory.get(territory.id) ?? 0,
      completedVisits: completedByTerritory.get(territory.id) ?? 0,
    }),
  );

  const completionTrendChartData = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(period.weekStart, index);
    const plannedVisits = visitPlans.filter(
      (visitPlan) => visitPlan.scheduled_date === date,
    ).length;
    const completedVisits = weeklyVisits.filter(
      (visit) => toKolkataDate(visit.completed_at) === date,
    ).length;

    return {
      label: new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(parseDateOnly(date)),
      completionPercentage: calculatePercentage(completedVisits, plannedVisits),
    };
  });

  const customerStatusCounts = new Map<
    Database["public"]["Enums"]["customer_status"],
    number
  >();
  customers.forEach((customer) => {
    customerStatusCounts.set(
      customer.status,
      (customerStatusCounts.get(customer.status) ?? 0) + 1,
    );
  });
  const customerStatusChartData: CustomerStatusChartPoint[] = Object.entries(
    customerStatusPresentation,
  ).map(([status, presentation]) => ({
    status: presentation.label,
    count:
      customerStatusCounts.get(
        status as Database["public"]["Enums"]["customer_status"],
      ) ?? 0,
    fill: presentation.fill,
  }));
  const managerPriorities = buildManagerPriorities({
    overdueCount: followUps.length,
    highPriorityOverdueCount,
    plannedVisits: visitPlans.length,
    completedVisits: weeklyVisits.length,
    hasMonthlyTarget,
    monthlyCompletedVisits: monthlyTargetVisits.length,
    monthlyCompletionPercentage,
    monthlyTargetCompletions,
  });
  const monthlyTargetSummary = hasMonthlyTarget
    ? monthlyTargetCompletions === 0
      ? `${monthlyTargetVisits.length} target-matched visit${monthlyTargetVisits.length === 1 ? " is" : "s are"} recorded this month against a zero-completion target.`
      : `${monthlyTargetVisits.length} visit${monthlyTargetVisits.length === 1 ? " is" : "s are"} recorded toward this month\u2019s target of ${monthlyTargetCompletions}.`
    : "No monthly completion target is available.";
  const summary = `Your team has completed ${weeklyVisits.length} of ${visitPlans.length} planned visits this week. ${followUps.length} open follow-up${followUps.length === 1 ? " is" : "s are"} overdue. ${monthlyTargetSummary}`;
  const data: ManagerDashboardData = {
    today,
    weekStart: period.weekStart,
    weekEnd: period.weekEnd,
    periodLabel,
    summary,
    kpis,
    overdueFollowUps,
    teamPerformance,
    managerPriorities,
    executiveVisitChartData,
    territoryVisitChartData,
    completionTrendChartData,
    customerStatusChartData,
  };

  return { status: "ready", data };
}
