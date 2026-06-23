"use client";

import { useState } from "react";

import { SectionHeading } from "@/features/dashboard/components/section-heading";
import { buildManagerWeeklyReportMarkdown } from "@/features/dashboard/data/manager-weekly-report-rules";
import type {
  ManagerInsightPriority,
  ManagerWeeklyReportPayload,
} from "@/features/dashboard/types";

type ReportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      payload: ManagerWeeklyReportPayload;
      message: string | null;
    };

const priorityStyles: Record<
  ManagerInsightPriority,
  { badge: string; border: string; label: string }
> = {
  high: {
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
    border: "border-l-rose-400",
    label: "High",
  },
  medium: {
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    border: "border-l-amber-400",
    label: "Medium",
  },
  low: {
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    border: "border-l-emerald-400",
    label: "Low",
  },
};

export function ManagerWeeklyReportPanel() {
  const [state, setState] = useState<ReportState>({ status: "idle" });

  async function handleGenerateReport() {
    setState({ status: "loading" });

    try {
      const response = await fetch("/api/manager-weekly-report", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        setState({ status: "error" });
        return;
      }

      const payload = (await response.json()) as ManagerWeeklyReportPayload;
      setState({ status: "ready", payload, message: null });
    } catch {
      setState({ status: "error" });
    }
  }

  async function handleCopyReport() {
    if (state.status !== "ready" || !state.payload.report) return;

    const markdown = buildManagerWeeklyReportMarkdown({
      report: state.payload.report,
      periodLabel: state.payload.periodLabel,
      generatedFor: state.payload.generatedFor,
      sourceLabel: state.payload.sourceLabel,
    });

    try {
      await navigator.clipboard.writeText(markdown);
      setState({
        ...state,
        message: "Report copied as Markdown.",
      });
    } catch {
      setState({
        ...state,
        message: "Copy failed. You can still download the Markdown report.",
      });
    }
  }

  function handleDownloadReport() {
    if (state.status !== "ready" || !state.payload.report) return;

    const markdown = buildManagerWeeklyReportMarkdown({
      report: state.payload.report,
      periodLabel: state.payload.periodLabel,
      generatedFor: state.payload.generatedFor,
      sourceLabel: state.payload.sourceLabel,
    });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = `fieldflow-weekly-manager-report-${state.payload.generatedFor}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
    setState({
      ...state,
      message: "Markdown report download started.",
    });
  }

  return (
    <section
      aria-labelledby="manager-weekly-report-title"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div id="manager-weekly-report-title">
          <SectionHeading
            eyebrow="Exportable weekly brief"
            title="Weekly manager report"
            description="Generate an on-demand report from authorized dashboard data, with Gemini when available and a deterministic fallback when it is not."
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Reports are generated only when requested and are not stored after
            refresh.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateReport}
          disabled={state.status === "loading"}
          className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-wait disabled:bg-slate-400 sm:w-auto"
        >
          {state.status === "loading" ? "Generating..." : "Generate report"}
        </button>
      </div>

      <div className="mt-5">
        {state.status === "idle" ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm font-semibold text-slate-800">
              No weekly report generated yet
            </p>
            <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-slate-500">
              Generate a fresh weekly brief when you want a copyable or
              downloadable manager summary.
            </p>
          </div>
        ) : null}

        {state.status === "loading" ? (
          <div
            role="status"
            className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-6 text-center"
          >
            <p className="text-sm font-semibold text-blue-900">
              Building weekly manager report...
            </p>
            <p className="mt-1 text-sm leading-6 text-blue-800/80">
              The server is reviewing visit execution, overdue work, targets,
              at-risk customers, and team performance.
            </p>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div
            role="alert"
            className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-center"
          >
            <p className="text-sm font-semibold text-amber-900">
              Weekly report is temporarily unavailable
            </p>
            <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-amber-800/80">
              We could not generate the report right now. Please refresh and
              try again shortly.
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
            {state.payload.source === "fallback" ? (
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Gemini was unavailable, so a deterministic weekly report is
                shown.
              </p>
            ) : null}

            {state.payload.report ? (
              <article className="mt-4 space-y-5 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-950">
                    {state.payload.report.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {state.payload.report.summary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Wins
                  </h4>
                  {state.payload.report.wins.length > 0 ? (
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                      {state.payload.report.wins.map((win) => (
                        <li key={win} className="flex gap-2">
                          <span aria-hidden="true" className="text-emerald-600">
                            +
                          </span>
                          <span>{win}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      No wins were highlighted for this reporting period.
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Risks
                  </h4>
                  <ul className="mt-2 space-y-3">
                    {state.payload.report.risks.map((risk) => {
                      const styles = priorityStyles[risk.priority];

                      return (
                        <li
                          key={`${risk.priority}-${risk.title}`}
                          className={`rounded-xl border border-slate-200 border-l-4 bg-white p-4 ${styles.border}`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <h5 className="text-sm font-semibold text-slate-950">
                              {risk.title}
                            </h5>
                            <span
                              className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles.badge}`}
                            >
                              {styles.label}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-slate-600">
                            {risk.detail}
                          </p>
                          <p className="mt-2 text-xs font-semibold leading-5 text-slate-800">
                            Recommended action: {risk.recommendedAction}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                    Next-week plan
                  </h4>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {state.payload.report.nextWeekPlan.map((planItem) => (
                      <li key={planItem}>{planItem}</li>
                    ))}
                  </ol>
                </div>

                <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Copy report
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadReport}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      Download .md
                    </button>
                  </div>
                  {state.message ? (
                    <p
                      role="status"
                      className="text-xs font-medium text-slate-500"
                    >
                      {state.message}
                    </p>
                  ) : null}
                </div>
              </article>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  No report content available
                </p>
                <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-slate-500">
                  There are not enough authorized operational records to build a
                  weekly report yet.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
