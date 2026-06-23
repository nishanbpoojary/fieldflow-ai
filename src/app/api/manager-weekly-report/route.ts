import { generateGeminiManagerWeeklyReport } from "@/features/dashboard/data/gemini-manager-weekly-report";
import { getManagerDashboardData } from "@/features/dashboard/data/manager-dashboard";
import { generateManagerWeeklyReport } from "@/features/dashboard/data/manager-weekly-report";
import { getCurrentUser } from "@/lib/auth/current-user";

const genericError = "Manager weekly report is temporarily unavailable.";

export async function POST() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  if (currentUser.role !== "manager") {
    return Response.json({ error: "Access denied." }, { status: 403 });
  }

  const dashboardResult = await getManagerDashboardData(currentUser);

  if (dashboardResult.status === "unavailable") {
    return Response.json({ error: genericError }, { status: 503 });
  }

  if (dashboardResult.status === "empty") {
    return Response.json({
      source: "fallback",
      sourceLabel: "Rules-based fallback",
      periodLabel: dashboardResult.periodLabel,
      generatedFor: dashboardResult.today,
      report: null,
    });
  }

  const geminiReport = await generateGeminiManagerWeeklyReport(
    dashboardResult.data,
  );

  return Response.json(
    geminiReport ?? generateManagerWeeklyReport(dashboardResult.data),
  );
}
