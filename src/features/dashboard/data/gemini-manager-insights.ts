import "server-only";

import { GoogleGenAI } from "@google/genai";

import type {
  ManagerDashboardData,
  ManagerInsight,
  ManagerInsightPriority,
  ManagerInsightsPayload,
} from "@/features/dashboard/types";

const defaultGeminiModel = "gemini-3-flash-preview";
const maxTitleLength = 100;
const maxEvidenceLength = 240;
const maxRecommendedActionLength = 280;

const allowedInsightKeys = [
  "priority",
  "title",
  "evidence",
  "recommendedAction",
];
const validPriorities: ManagerInsightPriority[] = ["high", "medium", "low"];

interface MonthlyTargetSummary {
  available: boolean;
  completedVisits: number | null;
  targetCompletions: number | null;
}

interface GeminiDashboardSummary {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowedKeys: string[],
): boolean {
  const keys = Object.keys(value);

  return (
    keys.length === allowedKeys.length &&
    keys.every((key) => allowedKeys.includes(key))
  );
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

function buildDashboardSummary(
  data: ManagerDashboardData,
): GeminiDashboardSummary {
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

function buildPrompt(summary: GeminiDashboardSummary) {
  return [
    "You generate concise FieldFlow AI manager insight cards for a synthetic dealership operations portfolio demo.",
    "Use only the dashboard summary JSON below. Do not invent names, metrics, customer details, territories, dates, or counts. Do not mention unavailable values.",
    "Return strict JSON only. Do not wrap the response in Markdown. Do not include explanations outside the JSON.",
    'The response must have exactly one top-level key named "insights".',
    'Each insight must have exactly these keys: "priority", "title", "evidence", and "recommendedAction".',
    'Priority must be one of "high", "medium", or "low".',
    "Generate 3 to 5 insights when the data supports it. The evidence must cite only values present in the summary JSON.",
    `Dashboard summary JSON:\n${JSON.stringify(summary, null, 2)}`,
  ].join("\n\n");
}

function parseGeminiJson(rawText: string): unknown {
  return JSON.parse(rawText);
}

function validateTextField(
  value: unknown,
  maxLength: number,
): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  if (!trimmed || trimmed.length > maxLength) return null;

  return trimmed;
}

function validateGeminiInsights(rawText: string): ManagerInsight[] | null {
  let parsed: unknown;

  try {
    parsed = parseGeminiJson(rawText);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !hasOnlyKeys(parsed, ["insights"])) return null;

  const insights = parsed.insights;

  if (!Array.isArray(insights) || insights.length < 1 || insights.length > 5) {
    return null;
  }

  const validatedInsights: ManagerInsight[] = [];

  for (const [index, insight] of insights.entries()) {
    if (!isRecord(insight) || !hasOnlyKeys(insight, allowedInsightKeys)) {
      return null;
    }

    if (
      typeof insight.priority !== "string" ||
      !validPriorities.includes(insight.priority as ManagerInsightPriority)
    ) {
      return null;
    }

    const title = validateTextField(insight.title, maxTitleLength);
    const evidence = validateTextField(insight.evidence, maxEvidenceLength);
    const recommendedAction = validateTextField(
      insight.recommendedAction,
      maxRecommendedActionLength,
    );

    if (!title || !evidence || !recommendedAction) return null;

    validatedInsights.push({
      id: `gemini-insight-${index + 1}`,
      priority: insight.priority as ManagerInsightPriority,
      title,
      evidence,
      recommendedAction,
    });
  }

  return validatedInsights;
}

export async function generateGeminiManagerInsights(
  data: ManagerDashboardData,
): Promise<ManagerInsightsPayload | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildPrompt(buildDashboardSummary(data)),
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    const insights = response.text
      ? validateGeminiInsights(response.text)
      : null;

    if (!insights) return null;

    return {
      source: "gemini",
      sourceLabel: "Gemini-generated insight",
      periodLabel: data.periodLabel,
      generatedFor: data.today,
      insights,
    };
  } catch {
    return null;
  }
}
