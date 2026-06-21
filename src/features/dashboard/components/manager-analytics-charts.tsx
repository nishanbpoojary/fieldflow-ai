import { CompletionTrendChart } from "@/features/dashboard/components/charts/completion-trend-chart";
import { CustomerStatusChart } from "@/features/dashboard/components/charts/customer-status-chart";
import { ExecutiveVisitsChart } from "@/features/dashboard/components/charts/executive-visits-chart";
import { TerritoryVisitsChart } from "@/features/dashboard/components/charts/territory-visits-chart";
import type {
  CustomerStatusChartPoint,
  MonthlyCompletionChartPoint,
  VisitComparisonChartPoint,
} from "@/features/dashboard/types";

interface ManagerAnalyticsChartsProps {
  executiveData: VisitComparisonChartPoint[];
  territoryData: VisitComparisonChartPoint[];
  completionData: MonthlyCompletionChartPoint[];
  customerStatusData: CustomerStatusChartPoint[];
}

export function ManagerAnalyticsCharts({
  executiveData,
  territoryData,
  completionData,
  customerStatusData,
}: ManagerAnalyticsChartsProps) {
  const hasChartData =
    executiveData.length > 0 ||
    territoryData.length > 0 ||
    completionData.length > 0 ||
    customerStatusData.length > 0;

  return (
    <section aria-labelledby="manager-analytics-title" className="min-w-0">
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
          Manager analytics
        </p>
        <h2
          id="manager-analytics-title"
          className="mt-1 text-lg font-semibold tracking-tight text-slate-950"
        >
          Team and customer trends
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Static demo analytics for weekly execution and customer coverage.
        </p>
      </div>

      {hasChartData ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
          <ExecutiveVisitsChart data={executiveData} />
          <TerritoryVisitsChart data={territoryData} />
          <CompletionTrendChart data={completionData} />
          <CustomerStatusChart data={customerStatusData} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <h3 className="text-sm font-semibold text-slate-800">
            Analytics data is unavailable
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Chart cards will appear when manager demo data is available.
          </p>
        </div>
      )}
    </section>
  );
}
