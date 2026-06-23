import "server-only";

import { GoogleGenAI } from "@google/genai";

import {
  buildManagerWeeklyReportSummary,
  type ManagerWeeklyReportSummary,
} from "@/features/dashboard/data/manager-weekly-report";
import type {
  ManagerDashboardData,
  ManagerInsightPriority,
  ManagerWeeklyReport,
  ManagerWeeklyReportPayload,
  ManagerWeeklyReportRisk,
} from "@/features/dashboard/types";

const defaultGeminiModel = "gemini-3-flash-preview";
const maxTitleLength = 100;
const maxSummaryLength = 500;
const maxWinLength = 220;
const maxRiskDetailLength = 300;
const maxRecommendedActionLength = 300;
const maxPlanItemLength = 220;
const topLevelKeys = ["title", "summary", "wins", "risks", "nextWeekPlan"];
const riskKeys = ["priority", "title", "detail", "recommendedAction"];
const validPriorities: ManagerInsightPriority[] = ["high", "medium", "low"];

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

function buildPrompt(summary: ManagerWeeklyReportSummary) {
  return [
    "You generate a concise FieldFlow AI weekly manager report for a synthetic dealership operations portfolio demo.",
    "Use only the authorized dashboard summary JSON below. Do not invent names, metrics, customer details, territories, dates, or counts. Do not mention unavailable values.",
    "Return strict JSON only. Do not wrap the response in Markdown. Do not include explanations outside the JSON.",
    'The response must have exactly these top-level keys: "title", "summary", "wins", "risks", and "nextWeekPlan".',
    'Each risk must have exactly these keys: "priority", "title", "detail", and "recommendedAction".',
    'Priority must be one of "high", "medium", or "low".',
    "wins must contain 0 to 3 strings. risks must contain 1 to 5 objects. nextWeekPlan must contain 2 to 5 strings.",
    "Every claim must be backed by values present in the summary JSON.",
    `Dashboard summary JSON:\n${JSON.stringify(summary, null, 2)}`,
  ].join("\n\n");
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

function validateTextArray(
  value: unknown,
  minItems: number,
  maxItems: number,
  maxLength: number,
): string[] | null {
  if (!Array.isArray(value) || value.length < minItems || value.length > maxItems) {
    return null;
  }

  const validatedItems: string[] = [];

  for (const item of value) {
    const validatedItem = validateTextField(item, maxLength);

    if (!validatedItem) return null;

    validatedItems.push(validatedItem);
  }

  return validatedItems;
}

function validateRisks(value: unknown): ManagerWeeklyReportRisk[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) {
    return null;
  }

  const risks: ManagerWeeklyReportRisk[] = [];

  for (const risk of value) {
    if (!isRecord(risk) || !hasOnlyKeys(risk, riskKeys)) return null;

    if (
      typeof risk.priority !== "string" ||
      !validPriorities.includes(risk.priority as ManagerInsightPriority)
    ) {
      return null;
    }

    const title = validateTextField(risk.title, maxTitleLength);
    const detail = validateTextField(risk.detail, maxRiskDetailLength);
    const recommendedAction = validateTextField(
      risk.recommendedAction,
      maxRecommendedActionLength,
    );

    if (!title || !detail || !recommendedAction) return null;

    risks.push({
      priority: risk.priority as ManagerInsightPriority,
      title,
      detail,
      recommendedAction,
    });
  }

  return risks;
}

function validateGeminiReport(rawText: string): ManagerWeeklyReport | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }

  if (!isRecord(parsed) || !hasOnlyKeys(parsed, topLevelKeys)) return null;

  const title = validateTextField(parsed.title, maxTitleLength);
  const summary = validateTextField(parsed.summary, maxSummaryLength);
  const wins = validateTextArray(parsed.wins, 0, 3, maxWinLength);
  const risks = validateRisks(parsed.risks);
  const nextWeekPlan = validateTextArray(
    parsed.nextWeekPlan,
    2,
    5,
    maxPlanItemLength,
  );

  if (!title || !summary || !wins || !risks || !nextWeekPlan) {
    return null;
  }

  return {
    title,
    summary,
    wins,
    risks,
    nextWeekPlan,
  };
}

export async function generateGeminiManagerWeeklyReport(
  data: ManagerDashboardData,
): Promise<ManagerWeeklyReportPayload | null> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildPrompt(buildManagerWeeklyReportSummary(data)),
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    const report = response.text ? validateGeminiReport(response.text) : null;

    if (!report) return null;

    return {
      source: "gemini",
      sourceLabel: "Gemini-generated weekly report",
      periodLabel: data.periodLabel,
      generatedFor: data.today,
      report,
    };
  } catch {
    return null;
  }
}
