"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from '@/utils/financial-utils';
import { Bill, Expense } from "@/types/financial";
import { startOfDay, endOfDay } from "date-fns";

interface CategoryPieChartProps {
  expenses: (Bill | Expense)[];
  dateRange: { from: Date; to: Date };
}

const COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#64748b", // slate
  "#84cc16", // lime
  "#6366f1", // indigo
  "#d946ef", // fuchsia
  "#14b8a6", // teal
];

export function CategoryPieChart({ expenses, dateRange }: CategoryPieChartProps) {
  const data = useMemo(() => {
    const categoryTotals = expenses
      .filter(expense => {
        const date = new Date('date' in expense ? expense.date : expense.dueDate);
        return date >= startOfDay(dateRange.from) && date <= endOfDay(dateRange.to);
      })
      .reduce((acc, expense) => {
        const category = expense.category;
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, dateRange]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm">{formatCurrency(item.value)}</p>
          <p className="text-sm text-muted-foreground">
            {((item.value / total) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="80%"
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
