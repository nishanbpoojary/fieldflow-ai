"use client";

import { useState } from "react";

import { SectionHeading } from "@/features/dashboard/components/section-heading";
import type {
  ManagerInsightPriority,
  ManagerInsightsPayload,
} from "@/features/dashboard/types";

type InsightsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; payload: ManagerInsightsPayload };

const priorityStyles: Record<
  ManagerInsightPriority,
  { badge: string; border: string; label: string }
> = {
  high: {
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
    border: "border-l-rose-400",
    label: "High priority",
  },
  medium: {
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    border: "border-l-amber-400",
    label: "Medium priority",
  },
  low: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    border: "border-l-emerald-400",
    label: "Low priority",
  },
};

export function ManagerInsightsPanel() {
  const [state, setState] = useState<InsightsState>({ status: "idle" });

  async function handleGenerateInsights() {
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/manager-insights", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        setState({ status: "error" });
        return;
      }

      const payload = (await response.json()) as ManagerInsightsPayload;
      setState({ status: "ready", payload });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <section
      aria-labelledby="manager-insights-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div id="manager-insights-title">
          <SectionHeading
            eyebrow="On-demand decision support"
            title="Manager insights"
            description="Generate recommendations from the current authorized dashboard data with Gemini when available and a deterministic fallback when it is not."
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Results are generated only when you click the button and are not
            stored yet.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateInsights}
          disabled={state.status === "loading"}
          className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:bg-blue-400 sm:w-auto"
        >
          {state.status === "loading" ? "Generating..." : "Generate insights"}
        </button>
      </div>

      <div className="mt-5">
        {state.status === "idle" ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No insights generated yet
            </p>
            <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Generate insights when you want a fresh read of the live Manager
              dashboard.
            </p>
          </div>
        ) : null}

        {state.status === "loading" ? (
          <div
            role="status"
            className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-6 text-center"
          >
            <p className="text-sm font-semibold text-blue-900">
              Reviewing current team records...
            </p>
            <p className="mt-1 text-sm leading-6 text-blue-800/80">
              The server is checking overdue work, visit completion, targets,
              customer status, and team gaps.
            </p>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center"
          >
            <p className="text-sm font-semibold text-amber-900">
              Insights are temporarily unavailable
            </p>
            <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-amber-800/80">
              We could not generate recommendations right now. Please refresh
              and try again shortly.
            </p>
          </div>
        ) : null}

        {state.status === "ready" ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-600">
                {state.payload.sourceLabel}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {state.payload.periodLabel}
              </span>
            </div>
            {state.payload.source === "rules" ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Gemini was unavailable, so deterministic dashboard insights are
                shown.
              </p>
            ) : null}

            {state.payload.insights.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {state.payload.insights.map((insight) => {
                  const styles = priorityStyles[insight.priority];

                  return (
                    <li
                      key={insight.id}
                      className={`rounded-xl border border-slate-200 border-l-4 bg-slate-50/70 p-4 ${styles.border}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <h3 className="text-sm font-semibold text-slate-950">
                          {insight.title}
                        </h3>
                        <span
                          className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles.badge}`}
                        >
                          {styles.label}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-600">
                        <span className="font-semibold text-slate-700">
                          Evidence:
                        </span>{" "}
                        {insight.evidence}
                      </p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-800">
                        Recommended action: {insight.recommendedAction}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  No insight cards available
                </p>
                <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-slate-500">
                  There are not enough authorized operational records to produce
                  recommendations yet.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
