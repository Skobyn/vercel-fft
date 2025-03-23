import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";

type ForecastDataPoint = {
  date: string;
  balance: number;
  income: number;
  mandatoryExpenses: number;
  optionalExpenses: number;
  projectedBalance: number; // Balance + income - expenses
};

type ForecastChartProps = {
  data: ForecastDataPoint[];
  includeOptionalExpenses: boolean;
  className?: string;
};

export function ForecastChart({ data, includeOptionalExpenses, className }: ForecastChartProps) {
  // Process data to calculate the cumulative balance over time
  const processedData = data.map((point, index, arr) => {
    // For the first point, the starting balance is the given balance
    // For subsequent points, it's the projected balance from the previous point
    const startingBalance = index === 0 ? point.balance : arr[index - 1].projectedBalance;

    // Calculate projected balance including or excluding optional expenses
    const projectedBalance = startingBalance + point.income - point.mandatoryExpenses -
      (includeOptionalExpenses ? point.optionalExpenses : 0);

    return {
      ...point,
      startingBalance,
      projectedBalance,
      // Format date for display
      displayDate: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  });

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Custom tooltip to show detailed information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded p-3 shadow-md">
          <p className="font-medium">{data.displayDate}</p>
          <p className="text-sm text-muted-foreground">
            Starting: <span className="font-medium">{formatCurrency(data.startingBalance)}</span>
          </p>
          <p className="text-sm text-emerald-500">
            Income: <span className="font-medium">+{formatCurrency(data.income)}</span>
          </p>
          <p className="text-sm text-rose-500">
            Mandatory: <span className="font-medium">-{formatCurrency(data.mandatoryExpenses)}</span>
          </p>
          {includeOptionalExpenses && (
            <p className="text-sm text-amber-500">
              Optional: <span className="font-medium">-{formatCurrency(data.optionalExpenses)}</span>
            </p>
          )}
          <div className="h-px w-full bg-border my-1" />
          <p className="text-sm font-medium">
            Projected: <span>{formatCurrency(data.projectedBalance)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#666" strokeOpacity={0.2} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => `$${value}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="projectedBalance"
            name="Projected Balance"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#balanceGradient)"
          />
          <Line
            type="monotone"
            dataKey="startingBalance"
            name="Starting Balance"
            stroke="#6b7280"
            strokeDasharray="5 5"
            strokeWidth={1}
            dot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
