"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { formatCurrency } from '@/utils/financial-utils';
import { Income, Bill, Expense } from "@/types/financial";
import { startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

interface IncomeExpensesChartProps {
  incomes: Income[];
  expenses: (Bill | Expense)[];
  dateRange: { from: Date; to: Date };
}

export function IncomeExpensesChart({ incomes, expenses, dateRange }: IncomeExpensesChartProps) {
  const data = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfMonth(dateRange.from),
      end: endOfMonth(dateRange.to)
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthlyIncome = incomes
        .filter(income => {
          const date = new Date(income.date);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, income) => sum + income.amount, 0);

      const monthlyExpenses = expenses
        .filter(expense => {
          const date = new Date('date' in expense ? expense.date : expense.dueDate);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        month: month.toLocaleDateString('default', { month: 'short' }),
        income: monthlyIncome,
        expenses: monthlyExpenses,
        savings: monthlyIncome - monthlyExpenses
      };
    });
  }, [incomes, expenses, dateRange]);

  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-md shadow-lg border">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`tooltip-${index}`} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
          {payload.length >= 2 && (
            <p className="font-medium text-green-600 mt-2">
              Savings: {formatCurrency(payload[0].value - payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={formatYAxis} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine y={0} stroke="#000" />
        <Bar dataKey="income" name="Income" fill="#4ade80" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
        <Bar dataKey="savings" name="Savings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
