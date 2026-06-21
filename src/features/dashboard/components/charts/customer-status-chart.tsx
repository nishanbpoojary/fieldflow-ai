"use client";

import {
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ChartCard } from "@/features/dashboard/components/charts/chart-card";
import type { CustomerStatusChartPoint } from "@/features/dashboard/types";

interface CustomerStatusChartProps {
  data: CustomerStatusChartPoint[];
}

export function CustomerStatusChart({ data }: CustomerStatusChartProps) {
  return (
    <ChartCard
      title="Customer status breakdown"
      description="Distribution of all 148 assigned customer accounts by status."
    >
      <div
        aria-label="Donut chart showing 82 active, 28 follow-up due, 21 new, and 17 dormant customers"
        className="h-72 w-full min-w-0"
        role="img"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer>
            <Pie
              data={data}
              dataKey="count"
              innerRadius={52}
              nameKey="status"
              outerRadius={84}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={2}
            />
            <Tooltip />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
