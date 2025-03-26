"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/financial-utils";
import { Bill, Expense } from "@/types/financial";
import { eachDayOfInterval, format, startOfDay, endOfDay } from "date-fns";

interface SpendingTrendsChartProps {
  expenses: (Bill | Expense)[];
  dateRange: { from: Date; to: Date };
}

export function SpendingTrendsChart({ expenses, dateRange }: SpendingTrendsChartProps) {
  const data = useMemo(() => {
    const days = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to
    });

    // Get daily spending
    const dailyData = days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const dailyTotal = expenses
        .filter(expense => {
          const date = new Date('date' in expense ? expense.date : expense.dueDate);
          return date >= dayStart && date <= dayEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        date: format(day, 'MMM dd'),
        amount: dailyTotal,
        movingAverage: 0 // Will be calculated below
      };
    });

    // Calculate 7-day moving average
    const windowSize = 7;
    for (let i = 0; i < dailyData.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        sum += dailyData[j].amount;
        count++;
      }

      dailyData[i].movingAverage = sum / count;
    }

    return dailyData;
  }, [expenses, dateRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 text-sm">
            <p>
              Daily Spending: <span className="font-medium">{formatCurrency(payload[0].value)}</span>
            </p>
            <p>
              7-Day Average: <span className="font-medium">{formatCurrency(payload[1].value)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          interval={Math.floor(data.length / 10)}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis tickFormatter={(value) => formatCurrency(value).split('.')[0]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="amount"
          name="Daily Spending"
          stroke="#ef4444"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="movingAverage"
          name="7-Day Average"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
