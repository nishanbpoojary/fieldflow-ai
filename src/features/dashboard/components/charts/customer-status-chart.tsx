"use client";

import {
  Legend,
  Pie,
  PieChart,
  Tooltip,
} from "recharts";
import {
  ChartCard,
  ChartViewport,
} from "@/features/dashboard/components/charts/chart-card";
import type { CustomerStatusChartPoint } from "@/features/dashboard/types";

interface CustomerStatusChartProps {
  data: CustomerStatusChartPoint[];
}

export function CustomerStatusChart({ data }: CustomerStatusChartProps) {
  const customerCount = data.reduce((total, item) => total + item.count, 0);
  const accessibleLabel = `Donut chart showing customer status counts: ${data
    .map((item) => `${item.status}, ${item.count}`)
    .join("; ")}`;

  return (
    <ChartCard
      title="Customer status breakdown"
      description={`Distribution of ${customerCount} customer account${customerCount === 1 ? "" : "s"} by status.`}
    >
      <ChartViewport accessibleLabel={accessibleLabel}>
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
      </ChartViewport>
    </ChartCard>
  );
}
