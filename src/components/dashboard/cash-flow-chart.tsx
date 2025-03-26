"use client"

import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CalendarIcon, TrendingDown, TrendingUp, AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
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
  const financialData = useFinancialData();
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [timeframe, setTimeframe] = useState<string>("90");
  const [error, setError] = useState<string | null>(null);
  const [chartReady, setChartReady] = useState<boolean>(false);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Use ref to track last successful generation to prevent infinite loops
  const lastGenerationRef = useRef<{
    balanceId: string | null;
    incomesCount: number;
    billsCount: number;
    timeframe: string;
  }>({
    balanceId: null,
    incomesCount: 0,
    billsCount: 0,
    timeframe: "90"
  });
  
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
    if (financialData.loading) {
      setChartReady(false);
      return;
    }
    
    // Guard clause to prevent unnecessary processing
    if (!financialData.profileData) {
      setError("Financial profile data not available");
      setChartReady(true);
      return;
    }
    
    // Get current state for reference
    const currentBalance = financialData.profileData?.currentBalance || 0;
    const incomesArray = financialData.incomesData || [];
    const billsArray = financialData.billsData || [];
    const balanceId = `${currentBalance}-${financialData.profileData?.lastUpdated || ''}`;
    
    // Check if we need to regenerate the forecast
    const shouldRegenerateForcecast = 
      lastGenerationRef.current.balanceId !== balanceId ||
      lastGenerationRef.current.incomesCount !== incomesArray.length ||
      lastGenerationRef.current.billsCount !== billsArray.length ||
      lastGenerationRef.current.timeframe !== timeframe;
    
    // Skip generation if data is the same as before
    if (!shouldRegenerateForcecast && forecastData.length > 0) {
      setChartReady(true);
      return;
    }
    
    // Set state to indicate forecast generation is in progress
    setIsGeneratingForecast(true);
    setError(null);
    
    timeoutRef.current = setTimeout(() => {
      try {
        const days = parseInt(timeframe);
        
        // Log what we're working with
        console.log(`Generating forecast with ${incomesArray.length} incomes and ${billsArray.length} bills`);
        
        // Double-check for valid data before generating forecast
        if (typeof currentBalance !== 'number' || isNaN(currentBalance)) {
          throw new Error("Invalid current balance for forecast");
        }
        
        // Call the forecast generation utility
        const forecast = generateCashFlowForecast(
          currentBalance,
          incomesArray,
          billsArray,
          [], // No expenses for now
          [], // No balance adjustments for now
          days
        );
        
        // Check if we got a valid forecast
        if (!Array.isArray(forecast) || forecast.length === 0) {
          throw new Error("Generated forecast is empty or invalid");
        }
        
        // Update the last generation reference
        lastGenerationRef.current = {
          balanceId,
          incomesCount: incomesArray.length,
          billsCount: billsArray.length,
          timeframe
        };
        
        // Set the forecast data in state
        setForecastData(forecast);
        console.log(`Generated ${forecast.length} forecast items successfully`);
      } catch (error) {
        console.error("Error generating cash flow forecast:", error);
        setError(error instanceof Error ? error.message : "Unable to generate forecast");
        // Provide default data to prevent rendering issues
        setForecastData([{
          itemId: 'initial-balance',
          date: new Date().toISOString(),
          amount: financialData.profileData?.currentBalance ?? 0,
          category: 'balance',
          name: 'Current Balance',
          type: 'balance',
          runningBalance: financialData.profileData?.currentBalance ?? 0
        }]);
      } finally {
        setIsGeneratingForecast(false);
        setChartReady(true);
        timeoutRef.current = null;
      }
    }, 50); // Small delay to allow rendering
  }, [financialData, timeframe]);

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    setChartReady(false);  // Reset chart ready state
  };

  // Show loading state if data is still loading
  if (financialData.loading || isGeneratingForecast || !chartReady) {
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
              {financialData.loading ? "Loading your financial data..." : "Generating your cash flow forecast..."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state if there's an error
  if (error || !financialData.profileData) {
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
  const startingBalance = financialData.profileData.currentBalance || 0;
  const endBalance = forecastData.length > 0 
    ? (forecastData[forecastData.length - 1].runningBalance || startingBalance) 
    : startingBalance;
  
  const isPositive = endBalance >= startingBalance;
  const percentChange = startingBalance 
    ? ((endBalance - startingBalance) / Math.abs(startingBalance || 1)) * 100 
    : 0;

  // Create simple data for chart with event markers
  const chartData = forecastData.map((item) => {
    const isEvent = item.type === 'income' || item.type === 'expense';
    
    return {
      date: new Date(item.date).toLocaleDateString(),
      balance: item.runningBalance || 0,
      // Add event details for tooltip
      isEvent: isEvent,
      eventType: item.type,
      eventName: item.name,
      eventAmount: item.amount,
      eventCategory: item.category
    };
  });

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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis 
                  dataKey="date" 
                  tickLine={false}
                  tickMargin={10}
                  minTickGap={20}
                />
                <YAxis 
                  tickFormatter={(value) => `$${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                  tickLine={false}
                  tickMargin={10}
                />
                <Tooltip content={<EnhancedTooltip />} />
                <ReferenceLine y={0} stroke="#666" opacity={0.3} />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorBalance)"
                  strokeWidth={2}
                />
                <ReferenceLine y={0} stroke="#666" opacity={0.3} />
                <Area 
                  type="monotone" 
                  dataKey="balance"
                  stroke="transparent"
                  fill="transparent"
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

// Enhanced tooltip to show event details
function EnhancedTooltip({ active, payload }: any) {
  if (active && payload && payload.length > 0) {
    try {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white p-3 border rounded-md shadow-sm">
          <p className="font-medium">{formatDate(data.date, "long")}</p>
          <p className="text-sm font-medium">
            Balance: {formatCurrency(data.balance || 0)}
          </p>
          
          {data.isEvent && (
            <div className="mt-2 pt-2 border-t">
              <div className="flex items-center gap-1">
                {data.eventType === 'income' ? (
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-rose-500" />
                )}
                <p className="font-medium text-xs">
                  {data.eventName}
                </p>
              </div>
              <p className="text-xs">
                {formatCurrency(Math.abs(data.eventAmount))} 
                <span className="text-muted-foreground ml-1">({data.eventCategory})</span>
              </p>
            </div>
          )}
        </div>
      );
    } catch (err) {
      return <div className="bg-white p-3 border rounded-md shadow-sm">Error displaying data</div>;
    }
  }
  return null;
} 