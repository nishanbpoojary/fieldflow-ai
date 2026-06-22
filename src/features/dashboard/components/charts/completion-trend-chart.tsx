"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartCard,
  ChartViewport,
} from "@/features/dashboard/components/charts/chart-card";
import type { CompletionTrendChartPoint } from "@/features/dashboard/types";

interface CompletionTrendChartProps {
  data: CompletionTrendChartPoint[];
}

function formatPercentage(value: number) {
  return `${value}%`;
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  const accessibleLabel = `Line chart showing daily visit completion for the current week: ${data
    .map((item) => `${item.label}, ${item.completionPercentage} percent`)
    .join("; ")}`;

  return (
    <ChartCard
      title="Weekly visit completion trend"
      description="The share of each day's planned visits completed this week."
    >
      <ChartViewport accessibleLabel={accessibleLabel}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={formatPercentage}
              tickLine={false}
            />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Line
              activeDot={{ r: 5 }}
              dataKey="completionPercentage"
              dot={{ fill: "#2563eb", r: 3, strokeWidth: 0 }}
              name="Completion rate"
              stroke="#2563eb"
              strokeWidth={3}
              type="monotone"
              unit="%"
            />
          </LineChart>
      </ChartViewport>
    </ChartCard>
  );
}
