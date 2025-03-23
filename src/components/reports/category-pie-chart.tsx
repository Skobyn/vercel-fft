"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define the data structure for the chart
interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CategoryPieChartProps {
  data: CategoryData[];
}

// Custom tooltip content
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border rounded-md shadow-md p-3">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm">
          <span className="font-medium">${data.value.toFixed(2)}</span>
          <span className="text-muted-foreground ml-1">
            ({data.percentage.toFixed(1)}%)
          </span>
        </p>
      </div>
    );
  }

  return null;
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius="80%"
          innerRadius="50%"
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          formatter={(value, entry: any, index) => (
            <span className="text-sm">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
