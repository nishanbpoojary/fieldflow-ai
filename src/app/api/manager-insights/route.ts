import { generateManagerInsights } from "@/features/dashboard/data/manager-insights";
import { getManagerDashboardData } from "@/features/dashboard/data/manager-dashboard";
import { getCurrentUser } from "@/lib/auth/current-user";

const genericError = "Manager insights are temporarily unavailable.";

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
      sourceLabel: "Rules-based insight",
      periodLabel: dashboardResult.periodLabel,
      generatedFor: dashboardResult.today,
      insights: [],
    });
  }

  return Response.json(generateManagerInsights(dashboardResult.data));
}
