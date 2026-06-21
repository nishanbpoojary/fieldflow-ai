"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/features/dashboard/components/charts/chart-card";
import type { VisitComparisonChartPoint } from "@/features/dashboard/types";

interface TerritoryVisitsChartProps {
  data: VisitComparisonChartPoint[];
}

export function TerritoryVisitsChart({ data }: TerritoryVisitsChartProps) {
  return (
    <ChartCard
      title="Visits by territory"
      description="Weekly execution levels across the four active sales territories."
    >
      <div
        aria-label="Bar chart comparing planned and completed visits across Metro North, West Ridge, Central Market, and South District"
        className="h-72 w-full min-w-0"
        role="img"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              interval={0}
              tick={{ fill: "#64748b", fontSize: 10 }}
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
              fill="#0f766e"
              name="Completed"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
