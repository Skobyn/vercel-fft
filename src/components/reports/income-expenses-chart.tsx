"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define the data structure for the chart
interface IncomeExpensesData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

interface IncomeExpensesChartProps {
  data: IncomeExpensesData[];
}

export function IncomeExpensesChart({ data }: IncomeExpensesChartProps) {
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={formatCurrency} />
        <Tooltip
          formatter={(value) => formatCurrency(Number(value))}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Legend />
        <Bar
          name="Income"
          dataKey="income"
          fill="#4ade80"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          name="Expenses"
          dataKey="expenses"
          fill="#f87171"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          name="Savings"
          dataKey="savings"
          fill="#60a5fa"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
