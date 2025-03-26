"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { formatCurrency } from '@/utils/financial-utils';
import { useState } from 'react';

interface TrendData {
  date: string;
  amount: number;
  movingAverage: number;
}

interface SpendingTrendsChartProps {
  data: TrendData[];
}

export function SpendingTrendsChart({ data }: SpendingTrendsChartProps) {
  const [activePoint, setActivePoint] = useState<number | null>(null);

  const formatYAxis = (value: number): string => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return value.toString();
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      return (
        <div className="bg-white p-4 rounded-md shadow-lg border">
          <p className="font-medium">{formattedDate}</p>
          <p style={{ color: payload[0].color }}>
            Spending: {formatCurrency(payload[0].value)}
          </p>
          <p style={{ color: payload[1].color }}>
            Trend: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Find significant points (local maximums/minimums)
  const findSignificantPoints = () => {
    const points: number[] = [];
    
    // Skip first and last points
    for (let i = 1; i < data.length - 1; i++) {
      const prevAmount = data[i-1].amount;
      const currentAmount = data[i].amount;
      const nextAmount = data[i+1].amount;
      
      // Check if current point is a local maximum or minimum
      if ((currentAmount > prevAmount && currentAmount > nextAmount) ||
          (currentAmount < prevAmount && currentAmount < nextAmount)) {
        points.push(i);
      }
    }
    
    return points;
  };

  const significantPoints = findSignificantPoints();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        onMouseMove={(e) => {
          if (e.activeTooltipIndex !== undefined) {
            setActivePoint(e.activeTooltipIndex);
          } else {
            setActivePoint(null);
          }
        }}
        onMouseLeave={() => setActivePoint(null)}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatXAxis} 
          minTickGap={30}
        />
        <YAxis tickFormatter={formatYAxis} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="amount"
          name="Spending"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="movingAverage"
          name="Trend"
          stroke="#e11d48"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
        
        {/* Highlight significant points */}
        {significantPoints.map((index) => (
          <ReferenceDot
            key={`ref-dot-${index}`}
            x={data[index].date}
            y={data[index].amount}
            r={4}
            fill="#6366f1"
            stroke="#fff"
          />
        ))}
        
        {/* Highlight active point */}
        {activePoint !== null && (
          <ReferenceDot
            x={data[activePoint].date}
            y={data[activePoint].amount}
            r={8}
            fill="#6366f1"
            stroke="#fff"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
