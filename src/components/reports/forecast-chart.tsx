import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { formatCurrency } from "@/utils/financial-utils";
import { ForecastItem } from "@/types/financial";

interface ForecastChartProps {
  baselineData: ForecastItem[];
  scenarioData?: ForecastItem[];
  className?: string;
}

export function ForecastChart({ baselineData, scenarioData, className }: ForecastChartProps) {
  // Custom tooltip to show detailed information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const scenarioItem = scenarioData?.find(s => s.date === item.date);
      
      return (
        <div className="bg-background border rounded p-3 shadow-md">
          <p className="font-medium">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <p className="text-sm text-muted-foreground">
            {item.description}
          </p>
          <div className="h-px w-full bg-border my-1" />
          <p className="text-sm font-medium">
            Amount: <span>{formatCurrency(item.amount)}</span>
          </p>
          <p className="text-sm font-medium">
            Baseline Balance: <span>{formatCurrency(item.runningBalance ?? 0)}</span>
          </p>
          {scenarioItem && (
            <p className="text-sm font-medium text-emerald-500">
              Scenario Balance: <span>{formatCurrency(scenarioItem.runningBalance ?? 0)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={baselineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#666" strokeOpacity={0.2} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="scenarioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="runningBalance"
            name="Baseline"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#balanceGradient)"
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          {scenarioData && (
            <Area
              type="monotone"
              data={scenarioData}
              dataKey="runningBalance"
              name="Scenario"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#scenarioGradient)"
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
