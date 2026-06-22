"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartCard,
  ChartViewport,
} from "@/features/dashboard/components/charts/chart-card";
import type { VisitComparisonChartPoint } from "@/features/dashboard/types";

interface ExecutiveVisitsChartProps {
  data: VisitComparisonChartPoint[];
}

export function ExecutiveVisitsChart({ data }: ExecutiveVisitsChartProps) {
  const accessibleLabel = `Bar chart comparing planned and completed weekly visits by sales executive: ${data
    .map(
      (item) =>
        `${item.label}, ${item.plannedVisits} planned and ${item.completedVisits} completed`,
    )
    .join("; ")}`;

  return (
    <ChartCard
      title="Visits by executive"
      description="Planned and completed visits for each sales executive this week."
    >
      <ChartViewport accessibleLabel={accessibleLabel}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
            />
            <Tooltip cursor={{ fill: "#f1f5f9" }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="plannedVisits"
              fill="#cbd5e1"
              name="Planned"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="completedVisits"
              fill="#2563eb"
              name="Completed"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
      </ChartViewport>
    </ChartCard>
  );
}
