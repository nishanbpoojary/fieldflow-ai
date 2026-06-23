import type {
  ManagerDashboardData,
  ManagerInsightPriority,
  ManagerWeeklyReport,
  ManagerWeeklyReportPayload,
  ManagerWeeklyReportRisk,
  TeamPerformanceMember,
} from "@/features/dashboard/types";

interface MonthlyTargetSummary {
  available: boolean;
  completedVisits: number | null;
  targetCompletions: number | null;
}

export interface ManagerWeeklyReportSummary {
  weeklyPlannedVisits: number;
  weeklyCompletedVisits: number;
  overdueFollowUpCount: number;
  highPriorityOverdueFollowUpCount: number;
  monthlyTarget: MonthlyTargetSummary;
  atRiskCustomerCount: number;
  teamPerformanceRows: {
    executiveName: string;
    plannedVisits: number;
    completedVisits: number;
    completionPercentage: number;
  }[];
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function getWeeklyVisitTotals(data: ManagerDashboardData) {
  return data.teamPerformance.reduce(
    (totals, member) => ({
      plannedVisits: totals.plannedVisits + member.plannedVisits,
      completedVisits: totals.completedVisits + member.completedVisits,
    }),
    { plannedVisits: 0, completedVisits: 0 },
  );
}

function getAtRiskCustomerCount(data: ManagerDashboardData) {
  return (
    data.customerStatusChartData.find((point) => point.status === "At risk")
      ?.count ?? 0
  );
}

function getMonthlyTargetSummary(
  data: ManagerDashboardData,
): MonthlyTargetSummary {
  const monthlyTargetPriority = data.managerPriorities.find(
    (priority) => priority.id === "monthly-target",
  );

  if (
    !monthlyTargetPriority ||
    monthlyTargetPriority.detail.includes("No completion target")
  ) {
    return {
      available: false,
      completedVisits: null,
      targetCompletions: null,
    };
  }

  const standardTargetMatch = monthlyTargetPriority.detail.match(
    /^(\d+) of (\d+) targeted visit completions are recorded this month/,
  );

  if (standardTargetMatch) {
    return {
      available: true,
      completedVisits: Number(standardTargetMatch[1]),
      targetCompletions: Number(standardTargetMatch[2]),
    };
  }

  const zeroTargetMatch = monthlyTargetPriority.detail.match(
    /^The selected target is 0 completions; (\d+) matching visits? (?:is|are) recorded this month/,
  );

  if (zeroTargetMatch) {
    return {
      available: true,
      completedVisits: Number(zeroTargetMatch[1]),
      targetCompletions: 0,
    };
  }

  return {
    available: false,
    completedVisits: null,
    targetCompletions: null,
  };
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

function getTargetPriority(
  monthlyTarget: MonthlyTargetSummary,
): ManagerInsightPriority {
  if (!monthlyTarget.available || monthlyTarget.targetCompletions === null) {
    return "medium";
  }

  if (monthlyTarget.targetCompletions === 0) return "low";

  const completedVisits = monthlyTarget.completedVisits ?? 0;
  const completionRate =
    (completedVisits / monthlyTarget.targetCompletions) * 100;

  if (completionRate < 50) return "high";
  if (completionRate < 80) return "medium";
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

function buildTargetEvidence(monthlyTarget: MonthlyTargetSummary) {
  if (!monthlyTarget.available || monthlyTarget.targetCompletions === null) {
    return "No monthly completion target is available for the current month.";
  }

  const completedVisits = monthlyTarget.completedVisits ?? 0;

  if (monthlyTarget.targetCompletions === 0) {
    return `${completedVisits} target-matched ${pluralize(completedVisits, "visit")} recorded against a zero-completion monthly target.`;
  }

  return `${completedVisits} of ${monthlyTarget.targetCompletions} monthly target completions are recorded.`;
}

export function buildManagerWeeklyReportSummary(
  data: ManagerDashboardData,
): ManagerWeeklyReportSummary {
  const weeklyVisitTotals = getWeeklyVisitTotals(data);

  return {
    weeklyPlannedVisits: weeklyVisitTotals.plannedVisits,
    weeklyCompletedVisits: weeklyVisitTotals.completedVisits,
    overdueFollowUpCount: data.overdueFollowUps.length,
    highPriorityOverdueFollowUpCount: data.overdueFollowUps.filter(
      (followUp) => followUp.priority === "High",
    ).length,
    monthlyTarget: getMonthlyTargetSummary(data),
    atRiskCustomerCount: getAtRiskCustomerCount(data),
    teamPerformanceRows: data.teamPerformance.map((member) => ({
      executiveName: member.name,
      plannedVisits: member.plannedVisits,
      completedVisits: member.completedVisits,
      completionPercentage: member.completionPercentage,
    })),
  };
}

export function buildManagerWeeklyReportMarkdown({
  report,
  periodLabel,
  generatedFor,
  sourceLabel,
}: {
  report: ManagerWeeklyReport;
  periodLabel: string;
  generatedFor: string;
  sourceLabel: string;
}) {
  const wins =
    report.wins.length > 0
      ? report.wins.map((win) => `- ${win}`).join("\n")
      : "- No wins were highlighted for this reporting period.";
  const risks = report.risks
    .map(
      (risk) =>
        `- ${risk.title} (${risk.priority})\n  - Evidence: ${risk.detail}\n  - Recommended action: ${risk.recommendedAction}`,
    )
    .join("\n");
  const nextWeekPlan = report.nextWeekPlan
    .map((planItem) => `- ${planItem}`)
    .join("\n");

  return [
    `# ${report.title}`,
    "",
    `Period: ${periodLabel}`,
    `Generated for: ${generatedFor}`,
    `Source: ${sourceLabel}`,
    "",
    "## Summary",
    "",
    report.summary,
    "",
    "## Wins",
    "",
    wins,
    "",
    "## Risks",
    "",
    risks,
    "",
    "## Next-week plan",
    "",
    nextWeekPlan,
    "",
  ].join("\n");
}

export function generateManagerWeeklyReport(
  data: ManagerDashboardData,
): ManagerWeeklyReportPayload {
  const summary = buildManagerWeeklyReportSummary(data);
  const weeklyGap = Math.max(
    summary.weeklyPlannedVisits - summary.weeklyCompletedVisits,
    0,
  );
  const largestVisitGap = findLargestVisitGap(data.teamPerformance);
  const risks: ManagerWeeklyReportRisk[] = [
    {
      priority:
        summary.overdueFollowUpCount === 0
          ? "low"
          : summary.highPriorityOverdueFollowUpCount > 0
            ? "high"
            : "medium",
      title:
        summary.overdueFollowUpCount === 0
          ? "Follow-up queue is current"
          : "Overdue follow-ups need closure",
      detail:
        summary.overdueFollowUpCount === 0
          ? "There are no open follow-ups due before today."
          : `${summary.overdueFollowUpCount} overdue ${pluralize(summary.overdueFollowUpCount, "follow-up")} remain open, including ${summary.highPriorityOverdueFollowUpCount} high-priority ${pluralize(summary.highPriorityOverdueFollowUpCount, "item")}.`,
      recommendedAction:
        summary.overdueFollowUpCount === 0
          ? "Keep checking new commitments as the team completes visits."
          : "Review owner-by-owner follow-up commitments and confirm the next customer contact.",
    },
    {
      priority: getCompletionPriority(
        summary.weeklyCompletedVisits,
        summary.weeklyPlannedVisits,
      ),
      title:
        weeklyGap > 0
          ? "Weekly visit completion gap remains"
          : "Weekly visit execution is protected",
      detail:
        summary.weeklyPlannedVisits === 0
          ? "No non-cancelled visits are planned for the current week."
          : `${summary.weeklyCompletedVisits} of ${summary.weeklyPlannedVisits} planned weekly ${pluralize(summary.weeklyPlannedVisits, "visit")} are completed, leaving ${weeklyGap} still open.`,
      recommendedAction:
        weeklyGap > 0
          ? "Confirm the remaining pending visits and remove route or customer-availability blockers."
          : "Keep visit outcomes and related follow-up work current.",
    },
    {
      priority: getTargetPriority(summary.monthlyTarget),
      title: "Monthly target progress needs visibility",
      detail: buildTargetEvidence(summary.monthlyTarget),
      recommendedAction:
        "Use the current target gap to shape next week's visit planning and manager check-ins.",
    },
  ];

  if (summary.atRiskCustomerCount > 0) {
    risks.push({
      priority: summary.atRiskCustomerCount >= 3 ? "high" : "medium",
      title: "At-risk customers need retention focus",
      detail: `${summary.atRiskCustomerCount} ${pluralize(summary.atRiskCustomerCount, "customer")} currently marked at risk.`,
      recommendedAction:
        "Prioritize manager review for at-risk accounts before the next field cycle.",
    });
  }

  if (largestVisitGap) {
    risks.push({
      priority:
        largestVisitGap.plannedVisits - largestVisitGap.completedVisits >= 3
          ? "high"
          : "medium",
      title: `${largestVisitGap.name} has the largest visit gap`,
      detail: `${largestVisitGap.name} completed ${largestVisitGap.completedVisits} of ${largestVisitGap.plannedVisits} planned ${pluralize(largestVisitGap.plannedVisits, "visit")} this week.`,
      recommendedAction:
        "Check whether route timing, customer availability, or follow-up load is blocking completion.",
    });
  }

  const wins = [
    summary.weeklyCompletedVisits > 0
      ? `${summary.weeklyCompletedVisits} weekly ${pluralize(summary.weeklyCompletedVisits, "visit")} completed from authorized team records.`
      : null,
    summary.overdueFollowUpCount === 0
      ? "No overdue open follow-ups are currently visible."
      : null,
    summary.atRiskCustomerCount === 0
      ? "The current customer status mix shows 0 at-risk customers."
      : null,
  ].filter((win): win is string => Boolean(win));

  const report: ManagerWeeklyReport = {
    title: "Weekly manager operations report",
    summary:
      summary.weeklyPlannedVisits === 0
        ? `For ${data.periodLabel}, the team has no non-cancelled visits planned. ${summary.overdueFollowUpCount} overdue open follow-up${summary.overdueFollowUpCount === 1 ? " is" : "s are"} visible, and ${summary.atRiskCustomerCount} customer${summary.atRiskCustomerCount === 1 ? " is" : "s are"} marked at risk.`
        : `For ${data.periodLabel}, the team completed ${summary.weeklyCompletedVisits} of ${summary.weeklyPlannedVisits} planned visits. ${summary.overdueFollowUpCount} overdue open follow-up${summary.overdueFollowUpCount === 1 ? " is" : "s are"} visible, and ${summary.atRiskCustomerCount} customer${summary.atRiskCustomerCount === 1 ? " is" : "s are"} marked at risk.`,
    wins: wins.slice(0, 3),
    risks: risks.slice(0, 5),
    nextWeekPlan: [
      "Review pending visit plans with each Sales Executive before the next route cycle.",
      "Prioritize overdue follow-ups by customer urgency and priority level.",
      "Use monthly target progress to focus manager coaching and route planning.",
    ],
  };

  return {
    source: "fallback",
    sourceLabel: "Rules-based fallback",
    periodLabel: data.periodLabel,
    generatedFor: data.today,
    report,
  };
}
