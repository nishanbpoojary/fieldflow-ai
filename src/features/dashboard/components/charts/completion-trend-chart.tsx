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
import type { MonthlyCompletionChartPoint } from "@/features/dashboard/types";

interface CompletionTrendChartProps {
  data: MonthlyCompletionChartPoint[];
}

function formatPercentage(value: number) {
  return `${value}%`;
}

export function CompletionTrendChart({ data }: CompletionTrendChartProps) {
  return (
    <ChartCard
      title="Monthly visit completion trend"
      description="The share of planned visits completed across the last six months."
    >
      <ChartViewport accessibleLabel="Line chart showing monthly visit completion rising from 61 percent in January to 74 percent in June">
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: 12, left: -18, bottom: 0 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              domain={[50, 100]}
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
