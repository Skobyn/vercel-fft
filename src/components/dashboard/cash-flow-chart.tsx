"use client"

import { useState, useEffect, useRef, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { CalendarIcon, TrendingDown, TrendingUp, AlertCircle, ArrowUp, ArrowDown, Info } from "lucide-react";
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
import { useFinancialData, useAccounts } from "@/hooks/use-financial-data";
import { ForecastItem } from "@/types/financial";
import { formatCurrency, formatDate, generateCashFlowForecast } from "@/utils/financial-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, isBefore, isAfter, parseISO } from "date-fns";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { generateForecast } from "@/lib/forecast";
import { Transaction } from "@/types/transaction";

interface CashFlowChartProps {
  days?: number;
}

export function CashFlowChart({ days = 14 }: CashFlowChartProps) {
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chartReady, setChartReady] = useState<boolean>(false);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const financialData = useFinancialData();
  const { accounts, loading: accountsLoading } = useAccounts();
  
  // Use ref to track last successful generation to prevent infinite loops
  const lastGenerationRef = useRef<{
    balanceId: string | null;
    incomesCount: number;
    billsCount: number;
    expensesCount: number;
  }>({
    balanceId: null,
    incomesCount: 0,
    billsCount: 0,
    expensesCount: 0
  });
  
  // Reset chart state when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Get total account balance
  const currentBalance = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      // If no accounts, use profile balance
      return financialData.profile?.currentBalance || 0;
    }
    
    // Sum up all account balances
    return accounts.reduce((total, account) => {
      return total + (account.balance || 0);
    }, 0);
  }, [accounts, financialData.profile]);
  
  // Effect for generating forecast with safeguards
  useEffect(() => {
    if (
      !financialData.loading && 
      !accountsLoading && 
      !isGeneratingForecast
    ) {
      setIsGeneratingForecast(true);
      
      console.log(`Generating ${days}-day forecast client-side`);
      
      // Clear previous timeout if it exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Generate forecast with a slight delay to avoid blocking the UI
      timeoutRef.current = setTimeout(() => {
        try {
          // Use the account balance as starting balance
          const startingBalance = currentBalance;
          
          const forecast = generateCashFlowForecast({
            startDate: new Date(),
            days: days,
            startingBalance: startingBalance,
            incomes: financialData.incomes || [],
            bills: financialData.bills || [],
            expenses: financialData.expenses || []
          });
          
          console.log(`Generated forecast with ${forecast.length} items`);
          
          setForecastData(forecast);
          setChartReady(true);
          setError(null);
        } catch (err) {
          console.error('Error generating forecast:', err);
          setError('Failed to generate forecast. Please try again later.');
        } finally {
          setIsGeneratingForecast(false);
        }
      }, 300);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [financialData.loading, financialData.incomes, financialData.bills, 
      financialData.expenses, days, isGeneratingForecast, currentBalance, accountsLoading]);

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
            <CardDescription>Projected balance over next {days} days</CardDescription>
          </div>
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
          Based on your current balance, income, and bills over the next {days} days.
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