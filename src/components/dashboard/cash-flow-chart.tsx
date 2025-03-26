"use client"

import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CalendarIcon, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CashFlowChartProps {
  days?: number;
}

export function CashFlowChart({ days = 90 }: CashFlowChartProps) {
  const { profile, incomes, bills, loading } = useFinancialData();
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [timeframe, setTimeframe] = useState<string>("90");
  const [error, setError] = useState<string | null>(null);
  const [chartReady, setChartReady] = useState<boolean>(false);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset chart state when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Effect for generating forecast with safeguards
  useEffect(() => {
    // Clear previous timeout if it exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Don't do anything if still loading
    if (loading) {
      setChartReady(false);
      return;
    }
    
    // Guard clause to prevent unnecessary processing
    if (!profile?.profile) {
      setError("Financial profile data not available");
      setChartReady(true);
      return;
    }
    
    // Set state to indicate forecast generation is in progress
    setIsGeneratingForecast(true);
    setError(null);
    
    // Use timeout to avoid blocking the main thread for too long
    timeoutRef.current = setTimeout(() => {
      try {
        // Safely access profile.profile, which we already checked above
        // Using non-null assertion since we already checked above
        const profileData = profile.profile!;
        
        // Use safe values for logging
        const balanceForLogging = typeof profileData.currentBalance === 'number' 
          ? profileData.currentBalance 
          : 0;
        
        console.log("Generating cash flow forecast with:", {
          balance: balanceForLogging,
          incomes: (incomes?.incomes || []).length,
          bills: (bills?.bills || []).length,
          timeframe
        });
        
        // Use null coalescing to ensure we have valid values
        const balance = profileData.currentBalance ?? 0;
        const incomeData = incomes?.incomes || [];
        const billData = bills?.bills || [];
        const daysValue = parseInt(timeframe);
        
        // Additional guard clauses
        if (isNaN(balance)) {
          throw new Error("Invalid balance value");
        }
        
        if (!Array.isArray(incomeData) || !Array.isArray(billData)) {
          throw new Error("Income or bill data is not an array");
        }
        
        // Generate forecast
        const forecast = generateCashFlowForecast(
          balance,
          incomeData,
          billData,
          [], // No balance adjustments yet
          daysValue
        );
        
        // Only update state if forecast is valid
        if (Array.isArray(forecast) && forecast.length > 0) {
          setForecastData(forecast);
          setError(null);
        } else {
          setError("Unable to generate forecast data");
        }
      } catch (error) {
        console.error("Error generating cash flow forecast:", error);
        setError(error instanceof Error ? error.message : "Unable to generate forecast");
        // Provide default data to prevent rendering issues
        setForecastData([{
          itemId: 'initial-balance',
          date: new Date().toISOString(),
          amount: profile.profile?.currentBalance ?? 0,
          category: 'balance',
          name: 'Current Balance',
          type: 'balance',
          runningBalance: profile.profile?.currentBalance ?? 0
        }]);
      } finally {
        setIsGeneratingForecast(false);
        setChartReady(true);
        timeoutRef.current = null;
      }
    }, 50); // Small delay to allow rendering
  }, [profile, incomes, bills, loading, timeframe]);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    setChartReady(false);  // Reset chart ready state
  };

  // Show loading state if data is still loading
  if (loading || isGeneratingForecast || !chartReady) {
    return (
      <Card className="col-span-2 h-[400px]">
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
          <CardDescription>Loading your financial data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">
              {loading ? "Loading your financial data..." : "Generating your cash flow forecast..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if there's an error
  if (error || !profile?.profile) {
    return (
      <Card className="col-span-2 h-[400px]">
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
          <CardDescription>Unable to generate forecast</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center justify-center">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "Financial profile not available. Please refresh the page."}
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Safe access to data
  const startingBalance = profile.profile.currentBalance || 0;
  const endBalance = forecastData.length > 0 
    ? (forecastData[forecastData.length - 1].runningBalance || startingBalance) 
    : startingBalance;
  
  const isPositive = endBalance >= startingBalance;
  const percentChange = startingBalance 
    ? ((endBalance - startingBalance) / Math.abs(startingBalance || 1)) * 100 
    : 0;

  // Simple tooltip component to avoid complex calculations
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      try {
        const data = payload[0].payload;
        return (
          <div className="bg-white p-3 border rounded-md shadow-sm">
            <p className="font-medium">{formatDate(data.date, "long")}</p>
            <p className="text-sm font-medium">
              Balance: {formatCurrency(data.balance || 0)}
            </p>
          </div>
        );
      } catch (err) {
        return <div className="bg-white p-3 border rounded-md shadow-sm">Error displaying data</div>;
      }
    }
    return null;
  };

  // Create simple data for chart
  const chartData = forecastData.map((item) => ({
    date: new Date(item.date).toLocaleDateString(),
    balance: item.runningBalance || 0,
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
          {chartData.length > 1 ? (
            <div className="h-full">
              {/* Fallback to simple display if chart doesn't render */}
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm font-semibold">Start: {formatCurrency(startingBalance)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(new Date().toISOString(), "long")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">End: {formatCurrency(endBalance)}</p>
                    <p className="text-xs text-muted-foreground">
                      {chartData.length > 0 && chartData[chartData.length - 1].date}
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 bg-gray-50 rounded-md p-4 overflow-auto">
                  <ul className="space-y-2">
                    {forecastData.map((item, i) => (
                      <li key={i} className="flex justify-between border-b pb-1">
                        <div>
                          <span className="text-sm">
                            {item.name} ({formatDate(item.date, "short")})
                          </span>
                        </div>
                        <div className="flex gap-4">
                          <span className={`text-sm ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(item.amount)}
                          </span>
                          <span className="text-sm font-medium">
                            {formatCurrency(item.runningBalance || 0)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
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