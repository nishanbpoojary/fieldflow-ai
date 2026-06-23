import "server-only";

import type {
  ManagerDashboardData,
  ManagerInsight,
  ManagerInsightPriority,
  ManagerInsightsPayload,
  TeamPerformanceMember,
} from "@/features/dashboard/types";

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function getWeeklyVisitTotals(data: ManagerDashboardData) {
  return data.teamPerformance.reduce(
    (totals, member) => ({
      planned: totals.planned + member.plannedVisits,
      completed: totals.completed + member.completedVisits,
    }),
    { planned: 0, completed: 0 },
  );
}

function getCompletionPriority(
  completedVisits: number,
  plannedVisits: number,
): ManagerInsightPriority {
  if (plannedVisits === 0) return "medium";

  const completionRate = (completedVisits / plannedVisits) * 100;

  if (completionRate < 60) return "high";
  if (completionRate < 85) return "medium";
  return "low";
}

function getAtRiskCustomerCount(data: ManagerDashboardData) {
  return (
    data.customerStatusChartData.find((point) => point.status === "At risk")
      ?.count ?? 0
  );
}

function getTargetPriority(detail: string): ManagerInsightPriority {
  if (detail.includes("No completion target")) return "medium";

  const percentageMatch = detail.match(/\((\d+)%\)/);
  const percentage = percentageMatch ? Number(percentageMatch[1]) : null;

  if (percentage === null) return "low";
  if (percentage < 50) return "high";
  if (percentage < 80) return "medium";
  return "low";
}

function findLargestVisitGap(
  members: TeamPerformanceMember[],
): TeamPerformanceMember | null {
  const membersWithGap = members
    .filter((member) => member.plannedVisits > member.completedVisits)
    .sort((first, second) => {
      const firstGap = first.plannedVisits - first.completedVisits;
      const secondGap = second.plannedVisits - second.completedVisits;

      return secondGap - firstGap || first.name.localeCompare(second.name);
    });

  return membersWithGap[0] ?? null;
}

export function generateManagerInsights(
  data: ManagerDashboardData,
): ManagerInsightsPayload {
  const insights: ManagerInsight[] = [];
  const overdueCount = data.overdueFollowUps.length;
  const highPriorityOverdueCount = data.overdueFollowUps.filter(
    (followUp) => followUp.priority === "High",
  ).length;
  const weeklyTotals = getWeeklyVisitTotals(data);
  const weeklyGap = Math.max(
    weeklyTotals.planned - weeklyTotals.completed,
    0,
  );
  const atRiskCustomerCount = getAtRiskCustomerCount(data);
  const monthlyTargetPriority = data.managerPriorities.find(
    (priority) => priority.id === "monthly-target",
  );
  const largestVisitGap = findLargestVisitGap(data.teamPerformance);

  insights.push({
    id: "overdue-follow-up-control",
    priority:
      overdueCount === 0 ? "low" : highPriorityOverdueCount > 0 ? "high" : "medium",
    title:
      overdueCount === 0
        ? "Follow-up queue is current"
        : "Overdue follow-ups need manager attention",
    evidence:
      overdueCount === 0
        ? "There are no open follow-ups due before today."
        : `${overdueCount} overdue ${pluralize(overdueCount, "follow-up")} found, including ${highPriorityOverdueCount} high-priority ${pluralize(highPriorityOverdueCount, "item")}.`,
    recommendedAction:
      overdueCount === 0
        ? "Keep checking new commitments as visits and customer conversations are updated."
        : "Review ownership with the assigned executives and confirm the next customer contact.",
  });

  insights.push({
    id: "weekly-visit-execution",
    priority: getCompletionPriority(
      weeklyTotals.completed,
      weeklyTotals.planned,
    ),
    title:
      weeklyGap > 0
        ? "Weekly visit completion has a gap"
        : "Weekly visit execution is on track",
    evidence:
      weeklyTotals.planned === 0
        ? "No non-cancelled visits are planned for the current week."
        : `${weeklyTotals.completed} of ${weeklyTotals.planned} planned weekly ${pluralize(weeklyTotals.planned, "visit")} are completed, leaving ${weeklyGap} open ${pluralize(weeklyGap, "visit")}.`,
    recommendedAction:
      weeklyGap > 0
        ? "Use the visit schedule to confirm which pending plans still need completion."
        : "Keep completed visit outcomes and follow-up actions current.",
  });

  if (monthlyTargetPriority) {
    insights.push({
      id: "monthly-target-progress",
      priority: getTargetPriority(monthlyTargetPriority.detail),
      title: monthlyTargetPriority.label,
      evidence: monthlyTargetPriority.detail,
      recommendedAction: monthlyTargetPriority.action,
    });
  }

  insights.push({
    id: "at-risk-customer-watchlist",
    priority:
      atRiskCustomerCount === 0
        ? "low"
        : atRiskCustomerCount >= 3
          ? "high"
          : "medium",
    title:
      atRiskCustomerCount === 0
        ? "No at-risk customers in the current mix"
        : "At-risk customers need retention focus",
    evidence:
      atRiskCustomerCount === 0
        ? "The customer status breakdown shows 0 at-risk customers."
        : `${atRiskCustomerCount} ${pluralize(atRiskCustomerCount, "customer")} currently marked at risk.`,
    recommendedAction:
      atRiskCustomerCount === 0
        ? "Keep monitoring status changes after visits and follow-ups."
        : "Prioritize manager review for the highest-value at-risk accounts before the next route cycle.",
  });

  if (largestVisitGap) {
    const gap =
      largestVisitGap.plannedVisits - largestVisitGap.completedVisits;

    insights.push({
      id: "team-performance-gap",
      priority: gap >= 3 ? "high" : "medium",
      title: `${largestVisitGap.name} has the largest visit gap`,
      evidence: `${largestVisitGap.name} has completed ${largestVisitGap.completedVisits} of ${largestVisitGap.plannedVisits} planned ${pluralize(largestVisitGap.plannedVisits, "visit")} this week.`,
      recommendedAction:
        "Check whether route timing, customer availability, or follow-up load is blocking completion.",
    });
  }

  return {
    source: "rules",
    sourceLabel: "Rules-based fallback",
    periodLabel: data.periodLabel,
    generatedFor: data.today,
    insights: insights.slice(0, 5),
  };
}
