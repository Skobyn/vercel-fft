"use client"

import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CalendarIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useFinancialData } from "@/hooks/use-financial-data";
import { ForecastItem, BalanceAdjustment } from "@/types/financial";
import { generateCashFlowForecast, formatCurrency, formatDate } from "@/utils/financial-utils";

interface CashFlowChartProps {
  days?: number;
}

export function CashFlowChart({ days = 90 }: CashFlowChartProps) {
  const { profile, incomes, bills, loading } = useFinancialData();
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [timeframe, setTimeframe] = useState<string>("90");
  
  useEffect(() => {
    if (profile?.profile && !loading) {
      const forecast = generateCashFlowForecast(
        profile.profile.currentBalance,
        incomes?.incomes || [],
        bills?.bills || [],
        [], // No balance adjustments yet
        parseInt(timeframe)
      );
      setForecastData(forecast);
    }
  }, [profile, incomes, bills, loading, timeframe]);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
  };

  if (loading) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  if (!profile.profile) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
          <CardDescription>Error loading forecast</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Unable to generate forecast</p>
        </CardContent>
      </Card>
    );
  }

  const startingBalance = profile.profile.currentBalance;
  const endBalance = forecastData.length > 0 
    ? forecastData[forecastData.length - 1].runningBalance || startingBalance 
    : startingBalance;
  
  const isPositive = endBalance >= startingBalance;
  const percentChange = startingBalance ? ((endBalance - startingBalance) / Math.abs(startingBalance)) * 100 : 0;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-sm">
          <p className="font-medium">{formatDate(data.date, "long")}</p>
          <p className="text-sm text-gray-500">{data.name}</p>
          <p className="text-sm font-medium mt-1">
            {data.type === 'balance' 
              ? 'Balance: ' 
              : data.type === 'income' 
                ? 'Income: ' 
                : data.type === 'expense' 
                  ? 'Bill: ' 
                  : 'Adjustment: '}
            <span className={data.amount >= 0 ? "text-green-600" : "text-red-600"}>
              {formatCurrency(data.amount)}
            </span>
          </p>
          <p className="text-sm font-medium">
            Running Balance: {formatCurrency(data.runningBalance || 0)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Create data for chart
  const chartData = forecastData.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    balance: item.runningBalance || 0,
    type: item.type,
    amount: item.amount,
    name: item.name,
    fullDate: item.date,
    runningBalance: item.runningBalance || 0
  }));

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Cash Flow Forecast</CardTitle>
            <CardDescription>Projected balance over time</CardDescription>
          </div>
          <Select onValueChange={handleTimeframeChange} defaultValue={timeframe}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="180">6 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Current</p>
            <p className="text-2xl font-bold">{formatCurrency(startingBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Projected</p>
            <div className="flex items-center justify-end">
              <p className="text-2xl font-bold mr-2">{formatCurrency(endBalance)}</p>
              <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                <span className="text-sm font-medium">{percentChange.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 5,
                  left: 5,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(value) => value.split('/').slice(0, 2).join('/')}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  tickFormatter={(value) => formatCurrency(value).split('.')[0]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine 
                  y={0} 
                  stroke="red" 
                  strokeDasharray="3 3" 
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#3b82f6"
                  fill="#3b82f680"
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <CalendarIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                <p className="text-muted-foreground">Add income and bills to see your cash flow forecast</p>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Based on your current balance, income, and bills over the next {timeframe} days.
        </p>
      </CardContent>
    </Card>
  );
} 