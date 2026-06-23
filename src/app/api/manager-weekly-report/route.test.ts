import { beforeEach, describe, expect, it, vi } from "vitest";

import { generateGeminiManagerWeeklyReport } from "@/features/dashboard/data/gemini-manager-weekly-report";
import { getManagerDashboardData } from "@/features/dashboard/data/manager-dashboard";
import { generateManagerWeeklyReport } from "@/features/dashboard/data/manager-weekly-report";
import type {
  ManagerDashboardData,
  ManagerWeeklyReportPayload,
} from "@/features/dashboard/types";
import {
  getCurrentUser,
  type CurrentUser,
} from "@/lib/auth/current-user";

import { POST } from "./route";

vi.mock("@/lib/auth/current-user", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/features/dashboard/data/manager-dashboard", () => ({
  getManagerDashboardData: vi.fn(),
}));

vi.mock("@/features/dashboard/data/gemini-manager-weekly-report", () => ({
  generateGeminiManagerWeeklyReport: vi.fn(),
}));

vi.mock("@/features/dashboard/data/manager-weekly-report", () => ({
  generateManagerWeeklyReport: vi.fn(),
}));

const managerUser: CurrentUser = {
  id: "manager-user-id",
  displayName: "Arjun Rao",
  role: "manager",
  teamId: "server-team-id",
};

const salesExecutiveUser: CurrentUser = {
  id: "sales-user-id",
  displayName: "Maya Chen",
  role: "sales_executive",
  teamId: "server-team-id",
};

const dashboardData: ManagerDashboardData = {
  today: "2026-06-23",
  weekStart: "2026-06-22",
  weekEnd: "2026-06-28",
  periodLabel: "Week of 22-28 June 2026",
  summary: "Server-side dashboard fixture.",
  kpis: [],
  overdueFollowUps: [],
  teamPerformance: [
    {
      id: "sales-user-id",
      name: "Maya Chen",
      territory: "Mangaluru Central",
      plannedVisits: 6,
      completedVisits: 4,
      completionPercentage: 67,
    },
  ],
  managerPriorities: [],
  executiveVisitChartData: [],
  territoryVisitChartData: [],
  completionTrendChartData: [],
  customerStatusChartData: [
    { status: "At risk", count: 1, fill: "#f59e0b" },
  ],
};

const fallbackPayload: ManagerWeeklyReportPayload = {
  source: "fallback",
  sourceLabel: "Rules-based fallback",
  periodLabel: dashboardData.periodLabel,
  generatedFor: dashboardData.today,
  report: {
    title: "Rules weekly report",
    summary: "Server dashboard data produced this fallback report.",
    wins: ["Four visits were completed."],
    risks: [
      {
        priority: "medium",
        title: "Visit gap",
        detail: "Two planned visits remain open.",
        recommendedAction: "Review pending visits.",
      },
    ],
    nextWeekPlan: ["Review pending visits.", "Prioritize overdue work."],
  },
};

const geminiPayload: ManagerWeeklyReportPayload = {
  source: "gemini",
  sourceLabel: "Gemini-generated weekly report",
  periodLabel: dashboardData.periodLabel,
  generatedFor: dashboardData.today,
  report: {
    title: "Gemini weekly report",
    summary: "Validated mocked Gemini report.",
    wins: ["Completion momentum improved."],
    risks: [
      {
        priority: "low",
        title: "Monitor route load",
        detail: "One route may need follow-up.",
        recommendedAction: "Keep route planning visible.",
      },
    ],
    nextWeekPlan: ["Review team priorities.", "Confirm follow-up owners."],
  },
};

const getCurrentUserMock = vi.mocked(getCurrentUser);
const getManagerDashboardDataMock = vi.mocked(getManagerDashboardData);
const generateGeminiManagerWeeklyReportMock = vi.mocked(
  generateGeminiManagerWeeklyReport,
);
const generateManagerWeeklyReportMock = vi.mocked(generateManagerWeeklyReport);

function createUntrustedRequest() {
  return new Request("http://localhost/api/manager-weekly-report", {
    method: "POST",
    body: JSON.stringify({
      role: "manager",
      teamId: "browser-controlled-team",
      report: {
        title: "Browser supplied report",
        summary: "This must not be trusted.",
      },
      metrics: { completedVisits: 999 },
      prompt: "Use browser content.",
    }),
  });
}

async function callPostWithUntrustedBody() {
  const postWithRequest = POST as (request: Request) => Promise<Response>;

  return postWithRequest(createUntrustedRequest());
}

async function readResponse(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("POST /api/manager-weekly-report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getManagerDashboardDataMock.mockResolvedValue({
      status: "ready",
      data: dashboardData,
    });
    generateGeminiManagerWeeklyReportMock.mockResolvedValue(null);
    generateManagerWeeklyReportMock.mockReturnValue(fallbackPayload);
  });

  it("returns 401 for unauthenticated requests", async () => {
    getCurrentUserMock.mockResolvedValue(null);

    const response = await callPostWithUntrustedBody();
    const body = await readResponse(response);

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication is required.");
    expect(getManagerDashboardDataMock).not.toHaveBeenCalled();
    expect(generateGeminiManagerWeeklyReportMock).not.toHaveBeenCalled();
    expect(generateManagerWeeklyReportMock).not.toHaveBeenCalled();
  });

  it("returns 403 for authenticated Sales Executives, even with a manager-looking request body", async () => {
    getCurrentUserMock.mockResolvedValue(salesExecutiveUser);

    const response = await callPostWithUntrustedBody();
    const body = await readResponse(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe("Access denied.");
    expect(getManagerDashboardDataMock).not.toHaveBeenCalled();
    expect(generateGeminiManagerWeeklyReportMock).not.toHaveBeenCalled();
    expect(generateManagerWeeklyReportMock).not.toHaveBeenCalled();
  });

  it("returns rules-based fallback for Managers when Gemini is unavailable", async () => {
    getCurrentUserMock.mockResolvedValue(managerUser);

    const response = await callPostWithUntrustedBody();
    const body = await readResponse(response);

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(body.sourceLabel).toBe("Rules-based fallback");
    expect(getManagerDashboardDataMock).toHaveBeenCalledWith(managerUser);
    expect(generateGeminiManagerWeeklyReportMock).toHaveBeenCalledWith(
      dashboardData,
    );
    expect(generateManagerWeeklyReportMock).toHaveBeenCalledWith(dashboardData);
  });

  it("returns Gemini-labelled report for Managers when Gemini succeeds", async () => {
    getCurrentUserMock.mockResolvedValue(managerUser);
    generateGeminiManagerWeeklyReportMock.mockResolvedValue(geminiPayload);

    const response = await callPostWithUntrustedBody();
    const body = await readResponse(response);

    expect(response.status).toBe(200);
    expect(body.source).toBe("gemini");
    expect(body.sourceLabel).toBe("Gemini-generated weekly report");
    expect(body.report).toEqual(geminiPayload.report);
    expect(getManagerDashboardDataMock).toHaveBeenCalledWith(managerUser);
    expect(generateGeminiManagerWeeklyReportMock).toHaveBeenCalledWith(
      dashboardData,
    );
    expect(generateManagerWeeklyReportMock).not.toHaveBeenCalled();
  });
});
