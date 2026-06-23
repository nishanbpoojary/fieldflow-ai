import { describe, expect, it } from "vitest";

import { generateManagerInsights } from "@/features/dashboard/data/manager-insights-rules";
import {
  buildManagerWeeklyReportMarkdown,
  generateManagerWeeklyReport,
} from "@/features/dashboard/data/manager-weekly-report-rules";
import type {
  ManagerDashboardData,
  ManagerInsightPriority,
} from "@/features/dashboard/types";

const validPriorities: ManagerInsightPriority[] = ["high", "medium", "low"];

const dashboardFixture: ManagerDashboardData = {
  today: "2026-06-23",
  weekStart: "2026-06-22",
  weekEnd: "2026-06-28",
  periodLabel: "Week of 22-28 June 2026",
  summary:
    "Synthetic manager fixture with a weekly visit gap and overdue follow-ups.",
  kpis: [],
  overdueFollowUps: [
    {
      id: "follow-up-1",
      customerName: "Aster Demo Motors",
      territory: "Mangaluru Central",
      priority: "High",
      dueStatus: "2 days overdue",
      assignedExecutive: "Maya Chen",
    },
    {
      id: "follow-up-2",
      customerName: "Riverbend Auto Hub",
      territory: "Bantwal",
      priority: "Medium",
      dueStatus: "1 day overdue",
      assignedExecutive: "Maya Chen",
    },
  ],
  teamPerformance: [
    {
      id: "executive-1",
      name: "Maya Chen",
      territory: "Mangaluru Central",
      plannedVisits: 8,
      completedVisits: 3,
      completionPercentage: 38,
    },
    {
      id: "executive-2",
      name: "Dev Patel",
      territory: "Bantwal",
      plannedVisits: 4,
      completedVisits: 3,
      completionPercentage: 75,
    },
  ],
  managerPriorities: [
    {
      id: "monthly-target",
      label: "Track monthly target progress",
      detail:
        "6 of 45 targeted visit completions are recorded this month (13%).",
      action: "Use the remaining target gap to guide weekly planning.",
      tone: "opportunity",
    },
  ],
  executiveVisitChartData: [],
  territoryVisitChartData: [],
  completionTrendChartData: [],
  customerStatusChartData: [
    { status: "Prospect", count: 4, fill: "#0ea5e9" },
    { status: "Active", count: 9, fill: "#2563eb" },
    { status: "At risk", count: 3, fill: "#f59e0b" },
    { status: "Converted", count: 2, fill: "#10b981" },
    { status: "Inactive", count: 1, fill: "#94a3b8" },
  ],
};

describe("manager dashboard deterministic rules", () => {
  it("returns a bounded set of valid rules-based manager insights", () => {
    const payload = generateManagerInsights(dashboardFixture);

    expect(payload.source).toBe("rules");
    expect(payload.insights.length).toBeGreaterThanOrEqual(1);
    expect(payload.insights.length).toBeLessThanOrEqual(5);
    expect(
      payload.insights.every((insight) =>
        validPriorities.includes(insight.priority),
      ),
    ).toBe(true);
  });

  it("flags high-priority overdue follow-ups as urgent manager work", () => {
    const payload = generateManagerInsights(dashboardFixture);
    const overdueInsight = payload.insights.find((insight) =>
      insight.evidence.toLowerCase().includes("high-priority"),
    );

    expect(overdueInsight).toBeDefined();
    expect(overdueInsight?.priority).toBe("high");
    expect(overdueInsight?.recommendedAction.toLowerCase()).toContain(
      "review",
    );
  });

  it("creates a weekly visit completion gap insight when planned visits exceed completions", () => {
    const payload = generateManagerInsights(dashboardFixture);
    const weeklyVisitInsight = payload.insights.find((insight) =>
      insight.title.toLowerCase().includes("visit completion"),
    );

    expect(weeklyVisitInsight).toBeDefined();
    expect(weeklyVisitInsight?.priority).toBe("high");
    expect(weeklyVisitInsight?.evidence.toLowerCase()).toContain("leaving");
  });

  it("builds a valid rules-based weekly report fallback", () => {
    const payload = generateManagerWeeklyReport(dashboardFixture);

    expect(payload.source).toBe("fallback");
    expect(payload.report).not.toBeNull();
    expect(payload.report?.title).toBeTruthy();
    expect(payload.report?.summary).toContain(dashboardFixture.periodLabel);
    expect(payload.report?.wins.length).toBeGreaterThan(0);
    expect(payload.report?.wins.length).toBeLessThanOrEqual(3);
    expect(payload.report?.risks.length).toBeGreaterThanOrEqual(1);
    expect(payload.report?.risks.length).toBeLessThanOrEqual(5);
    expect(payload.report?.nextWeekPlan.length).toBeGreaterThanOrEqual(2);
    expect(payload.report?.nextWeekPlan.length).toBeLessThanOrEqual(5);
    expect(
      payload.report?.risks.every((risk) =>
        validPriorities.includes(risk.priority),
      ),
    ).toBe(true);
  });

  it("builds Markdown with required sections and no nullish placeholders", () => {
    const payload = generateManagerWeeklyReport(dashboardFixture);

    expect(payload.report).not.toBeNull();

    const report = payload.report;

    if (!report) {
      throw new Error("Expected the fallback report fixture to produce content.");
    }

    const markdown = buildManagerWeeklyReportMarkdown({
      report,
      periodLabel: payload.periodLabel,
      generatedFor: payload.generatedFor,
      sourceLabel: payload.sourceLabel,
    });

    expect(markdown).toContain(`# ${report.title}`);
    expect(markdown).toContain(`Period: ${dashboardFixture.periodLabel}`);
    expect(markdown).toContain("## Summary");
    expect(markdown).toContain("## Wins");
    expect(markdown).toContain("## Risks");
    expect(markdown).toContain("## Next-week plan");
    expect(markdown).not.toContain("undefined");
    expect(markdown).not.toContain("null");
  });
});
