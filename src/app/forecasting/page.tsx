"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CircleDollarSign,
  ArrowUp,
  ArrowDown,
  Calendar,
  LineChart,
  TrendingUp,
  Settings,
  AlertCircle,
  Wallet,
  Plus,
  Edit,
  Check,
  CalendarClock,
  CreditCard,
  CalendarCheck,
  PiggyBank,
  BarChart
} from "lucide-react";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ForecastChart } from "@/components/reports/forecast-chart";
import { useAuth } from "@/providers/firebase-auth-provider";
import { useFinancialData } from "@/hooks/use-financial-data";
import { generateCashFlowForecast } from "@/utils/financial-utils";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatCurrency } from "@/utils/financial-utils";
import { ForecastItem } from "@/types/financial";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  BarChart as RechartsBarChart,
  Bar,
  Legend
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Types for our forecast data
type ExpectedIncome = {
  id: number;
  name: string;
  amount: number;
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly';
  date: string;
  isPredicted: boolean;
};

type MandatoryExpense = {
  id: number;
  name: string;
  amount: number;
  frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  date: string;
  category: string;
  isPredicted: boolean;
};

type OptionalExpense = {
  id: string;
  name: string;
  amount: number;
  category: string;
  likelihood: number; // 0-100%
  isPriority: boolean;
};

type MonthlyForecast = {
  month: string;
  income: number;
  mandatoryExpenses: number;
  optionalExpenses: number;
  netCashFlow: number;
  scenarioIncome?: number;
  scenarioMandatoryExpenses?: number;
  scenarioOptionalExpenses?: number;
  scenarioNetCashFlow?: number;
};

// Add these types near the top with other type definitions
type BalanceEdit = {
  date: string;
  oldBalance: number;
  newBalance: number;
  note?: string;
};

// Add type definition for the forecast period
type ForecastPeriod = "1m" | "3m" | "6m" | "12m";

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // Find the daily events for this date point
    const dayData = payload[0].payload;
    
    return (
      <div className="bg-background border rounded-md p-3 shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">Starting Balance: {formatCurrency(dayData.startingBalance || 0)}</p>
        <Separator className="my-2" />
        
        {dayData.dailyEvents?.incomes?.length > 0 && (
          <>
            <p className="text-sm font-medium text-green-500">Income:</p>
            {dayData.dailyEvents.incomes.map((income: any, i: number) => (
              <p key={`income-${i}`} className="text-xs">
                {income.name}: {formatCurrency(income.amount)}
              </p>
            ))}
            <Separator className="my-2" />
          </>
        )}
        
        {dayData.dailyEvents?.expenses?.length > 0 && (
          <>
            <p className="text-sm font-medium text-red-500">Expenses:</p>
            {dayData.dailyEvents.expenses.map((expense: any, i: number) => (
              <p key={`expense-${i}`} className="text-xs">
                {expense.name}: {formatCurrency(Math.abs(expense.amount))}
              </p>
            ))}
            <Separator className="my-2" />
          </>
        )}
        
        <p className="font-medium">
          Ending Balance: {formatCurrency(payload[0].value)}
        </p>
        
        {payload.length > 1 && (
          <p className="font-medium text-purple-500">
            Scenario Balance: {formatCurrency(payload[1].value)}
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ForecastingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const financialData = useFinancialData();
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyForecast[]>([]);

  // Various state for scenario mode
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [scenarioName, setScenarioName] = useState("Default Scenario");
  const [incomeAdjustment, setIncomeAdjustment] = useState(0);
  const [expensesAdjustment, setExpensesAdjustment] = useState(0);
  const [savingsAdjustment, setSavingsAdjustment] = useState(0);
  const [unexpectedExpense, setUnexpectedExpense] = useState(0);
  const [unexpectedIncome, setUnexpectedIncome] = useState(0);
  const [scenarioForecast, setScenarioForecast] = useState<ForecastItem[]>([]);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(0);
  const [balanceNote, setBalanceNote] = useState("");
  const [balanceEdits, setBalanceEdits] = useState<BalanceEdit[]>([]);
  
  // State for forecast period selection
  const [forecastPeriod, setForecastPeriod] = useState<ForecastPeriod>("3m");
  
  // State for filters and optional expenses
  const [includeOptionalExpenses, setIncludeOptionalExpenses] = useState(true);
  const [openAddIncomeDialog, setOpenAddIncomeDialog] = useState(false);
  const [openAddExpenseDialog, setOpenAddExpenseDialog] = useState(false);
  
  // Use ref to track last successful generation to prevent infinite loops
  const lastGenerationRef = useRef<{
    balanceId: string | null;
    incomesCount: number;
    billsCount: number;
    expensesCount: number;
    forecastPeriod: string;
  }>({
    balanceId: null,
    incomesCount: 0,
    billsCount: 0,
    expensesCount: 0,
    forecastPeriod: "3m"
  });
  
  // Placeholder for optional expenses - in the future, this would come from the database
  const optionalExpenses: OptionalExpense[] = [
    {
      id: '1',
      name: 'Entertainment',
      amount: 150,
      category: 'Entertainment',
      likelihood: 90,
      isPriority: false,
    },
    {
      id: '2',
      name: 'Shopping',
      amount: 200,
      category: 'Shopping',
      likelihood: 60,
      isPriority: false,
    }
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [authLoading, user, router]);

  // Generate forecast data
  useEffect(() => {
    if (financialData.loading) {
      return;
    }
    
    if (!financialData.profileData || !financialData.incomesData || !financialData.billsData || !financialData.expensesData) {
      return;
    }

    const currentBalance = financialData.profileData.currentBalance;
    const incomes = financialData.incomesData;
    const bills = financialData.billsData;
    const expenses = financialData.expensesData;
    
    // Check if we need to regenerate the forecast
    const balanceId = financialData.profileData.lastUpdated || Date.now().toString();
    const shouldRegenerateForcecast = 
      lastGenerationRef.current.balanceId !== balanceId ||
      lastGenerationRef.current.incomesCount !== incomes.length ||
      lastGenerationRef.current.billsCount !== bills.length ||
      lastGenerationRef.current.expensesCount !== expenses.length ||
      lastGenerationRef.current.forecastPeriod !== forecastPeriod;
    
    // Skip generation if data is the same as before
    if (!shouldRegenerateForcecast && forecastData.length > 0) {
      return;
    }
    
    // Calculate days based on forecastPeriod
    let forecastDays = 90;
    if (forecastPeriod === "1m") forecastDays = 30;
    if (forecastPeriod === "6m") forecastDays = 180;
    if (forecastPeriod === "12m") forecastDays = 365;
    
    try {
      // Generate baseline forecast with performance guardrails
      setForecastData([]); // Clear existing data to free memory
      
      // Generate forecast with batch processing if period is long
      let forecast: ForecastItem[];
      
      // Use a different approach based on forecast period length
      if (forecastDays <= 30) {
        // For short forecasts, process everything at once
        forecast = generateCashFlowForecast(
          currentBalance,
          incomes,
          bills,
          expenses,
          [], // No balance adjustments for now
          forecastDays
        );
      } else {
        // For longer forecasts, handle with care
        forecast = generateCashFlowForecast(
          currentBalance,
          incomes,
          bills,
          expenses,
          [], // No balance adjustments for now
          forecastDays
        );
        
        // Limit the number of items if we have too many
        if (forecast.length > 1000) {
          console.warn(`Limiting forecast from ${forecast.length} to 1000 items for performance`);
          // Keep first and last items, then sample in between
          const first = forecast.slice(0, 1);
          const last = forecast.slice(-100);
          const middle = forecast.slice(1, -100);
          
          // Sample middle items at regular intervals
          const sampledMiddle = [];
          const sampleInterval = Math.ceil(middle.length / 898);
          for (let i = 0; i < middle.length; i += sampleInterval) {
            sampledMiddle.push(middle[i]);
          }
          
          forecast = [...first, ...sampledMiddle, ...last];
        }
      }

      setForecastData(forecast);

      // Log resulting forecast size
      console.log(`Generated ${forecast.length} forecast items`);

      // Generate monthly breakdown from forecast data
      const monthlyData = generateMonthlyBreakdown(forecast, scenarioForecast);
      setMonthlyBreakdown(monthlyData);

      // Generate scenario forecast if simulation mode is enabled
      if (isSimulationMode) {
        generateScenarioForecast();
      } else {
        setScenarioForecast([]);
      }

      // Update last generation reference to track state
      lastGenerationRef.current = {
        balanceId,
        incomesCount: incomes.length,
        billsCount: bills.length,
        expensesCount: expenses.length,
        forecastPeriod
      };
    } catch (error) {
      console.error("Error generating forecast:", error);
      setForecastData([]);
      setScenarioForecast([]);
    }
  }, [financialData.profileData, financialData.incomesData, financialData.billsData, financialData.expensesData, forecastPeriod, isSimulationMode]);

  // Function to generate scenario forecast
  const generateScenarioForecast = useCallback(() => {
    if (!financialData.profileData || !financialData.incomesData || !financialData.billsData || !financialData.expensesData) return;

    // Calculate days based on forecastPeriod
    let forecastDays = 90;
    if (forecastPeriod === "1m") forecastDays = 30;
    else if (forecastPeriod === "3m") forecastDays = 90;
    else if (forecastPeriod === "6m") forecastDays = 180;
    else if (forecastPeriod === "12m") forecastDays = 365;

    try {
      const currentBalance = financialData.profileData.currentBalance || 0;
      const incomesArray = financialData.incomesData || [];
      const billsArray = financialData.billsData || [];
      const expensesArray = financialData.expensesData || [];

      // Apply income adjustment to all incomes
      const adjustedIncomes = incomesArray.map(income => ({
        ...income,
        amount: income.amount * (1 + incomeAdjustment / 100)
      }));
      
      // Apply expense adjustment to all bills and expenses
      const adjustedBills = billsArray.map(bill => ({
        ...bill,
        amount: bill.amount * (1 + expensesAdjustment / 100)
      }));

      const adjustedExpenses = expensesArray.map(expense => ({
        ...expense,
        amount: expense.amount * (1 + expensesAdjustment / 100)
      }));
      
      // Add monthly savings increase if specified
      const balanceAdjustments: any[] = [];
      if (savingsAdjustment > 0) {
        // Create an adjustment for each month in the forecast period
        const monthsInForecast = Math.min(Math.ceil(forecastDays / 30), 12); // Cap at 12 months
        for (let i = 0; i < monthsInForecast; i++) {
          const date = new Date();
          date.setDate(1); // First day of the month
          date.setMonth(date.getMonth() + i + 1); // Add months
          
          balanceAdjustments.push({
            id: `savings-increase-${i}`,
            date: date.toISOString(),
            amount: savingsAdjustment,
            category: 'Income',
            name: 'Monthly Savings Increase',
            type: 'income',
            description: 'Monthly Savings Increase'
          });
        }
      }
      
      // Add unexpected expense if specified
      if (unexpectedExpense > 0) {
        balanceAdjustments.push({
          id: `unexpected-${Date.now()}`,
          date: new Date().toISOString(),
          amount: -unexpectedExpense,
          category: 'Unexpected',
          name: 'Unexpected Expense',
          type: 'expense',
          description: 'Unexpected Expense'
        });
      }
      
      // Add unexpected income if specified
      if (unexpectedIncome > 0) {
        balanceAdjustments.push({
          id: `unexpected-income-${Date.now()}`,
          date: new Date().toISOString(),
          amount: unexpectedIncome,
          category: 'Unexpected',
          name: 'Unexpected Income',
          type: 'income',
          description: 'Unexpected Income'
        });
      }
      
      // Use the same optimization approach as in the baseline forecast
      let scenarioForecast: ForecastItem[];
      setScenarioForecast([]); // Clear existing data to free memory
      
      if (forecastDays <= 30) {
        // For short forecasts, process everything at once
        scenarioForecast = generateCashFlowForecast(
          currentBalance,
          adjustedIncomes,
          adjustedBills,
          adjustedExpenses,
          balanceAdjustments,
          forecastDays
        );
      } else {
        // Generate forecast with optimization for longer periods
        scenarioForecast = generateCashFlowForecast(
          currentBalance,
          adjustedIncomes,
          adjustedBills,
          adjustedExpenses,
          balanceAdjustments,
          forecastDays
        );
        
        // Limit the number of items if we have too many
        if (scenarioForecast.length > 1000) {
          console.warn(`Limiting scenario forecast from ${scenarioForecast.length} to 1000 items`);
          // Keep first and last items, then sample in between
          const first = scenarioForecast.slice(0, 1);
          const last = scenarioForecast.slice(-100);
          const middle = scenarioForecast.slice(1, -100);
          
          // Sample middle items at regular intervals
          const sampledMiddle = [];
          const sampleInterval = Math.ceil(middle.length / 898);
          for (let i = 0; i < middle.length; i += sampleInterval) {
            sampledMiddle.push(middle[i]);
          }
          
          scenarioForecast = [...first, ...sampledMiddle, ...last];
        }
      }
      
      setScenarioForecast(scenarioForecast);
      console.log(`Generated ${scenarioForecast.length} scenario forecast items`);
      
    } catch (error) {
      console.error("Error generating scenario forecast:", error);
      setScenarioForecast([]);
    }
  }, [financialData.profileData, financialData.incomesData, financialData.billsData, financialData.expensesData, forecastPeriod, incomeAdjustment, expensesAdjustment, savingsAdjustment, unexpectedExpense, unexpectedIncome]);

  // Function to generate monthly breakdown from forecast data
  const generateMonthlyBreakdown = (forecast: ForecastItem[], scenarioForecast: ForecastItem[] = []) => {
    // Skip if no forecast data
    if (!forecast || forecast.length === 0) {
      console.log("No forecast data to generate monthly breakdown");
      return [];
    }
    
    // Initialize map to track monthly data
    const monthlyData = new Map<string, {
      month: string;
      income: number;
      mandatoryExpenses: number;
      optionalExpenses: number;
      netCashFlow: number;
      scenarioIncome?: number;
      scenarioMandatoryExpenses?: number;
      scenarioOptionalExpenses?: number;
      scenarioNetCashFlow?: number;
    }>();
    
    try {
      // Process items in chunks to prevent UI freezing for large forecasts
      const processItems = (items: ForecastItem[], isScenario: boolean = false) => {
        // Define which categories are optional expenses
        const optionalCategories = ['Entertainment', 'Personal', 'Dining', 'Shopping'];
        
        // Process a maximum of 2000 items for performance
        const processLimit = 2000;
        const itemsToProcess = items.length > processLimit 
          ? [...items.slice(0, 100), ...items.slice(-processLimit + 100)]
          : items;
          
        if (items.length > processLimit) {
          console.warn(`Monthly breakdown processing limited from ${items.length} to ${processLimit} items`);
        }
        
        // Process each item in the forecast
        for (const item of itemsToProcess) {
          try {
            if (!item.date) continue;
            
            // Convert date to month key (YYYY-MM)
            const date = new Date(item.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            // Create or update monthly data
            if (!monthlyData.has(monthKey)) {
              monthlyData.set(monthKey, {
                month: monthLabel,
                income: 0,
                mandatoryExpenses: 0,
                optionalExpenses: 0,
                netCashFlow: 0,
                scenarioIncome: 0,
                scenarioMandatoryExpenses: 0,
                scenarioOptionalExpenses: 0,
                scenarioNetCashFlow: 0
              });
            }
            
            const monthData = monthlyData.get(monthKey)!;
            
            // Add to the appropriate category based on item type
            if (item.type === 'income') {
              if (isScenario) {
                monthData.scenarioIncome = (monthData.scenarioIncome || 0) + item.amount;
                monthData.scenarioNetCashFlow = (monthData.scenarioNetCashFlow || 0) + item.amount;
              } else {
                monthData.income += item.amount;
                monthData.netCashFlow += item.amount;
              }
            } else if (item.type === 'expense' || item.type === 'bill') {
              const expenseAmount = Math.abs(item.amount);
              
              // Categorize as mandatory or optional expense
              if (optionalCategories.includes(item.category)) {
                if (isScenario) {
                  monthData.scenarioOptionalExpenses = (monthData.scenarioOptionalExpenses || 0) + expenseAmount;
                  monthData.scenarioNetCashFlow = (monthData.scenarioNetCashFlow || 0) - expenseAmount;
                } else {
                  monthData.optionalExpenses += expenseAmount;
                  monthData.netCashFlow -= expenseAmount;
                }
              } else {
                if (isScenario) {
                  monthData.scenarioMandatoryExpenses = (monthData.scenarioMandatoryExpenses || 0) + expenseAmount;
                  monthData.scenarioNetCashFlow = (monthData.scenarioNetCashFlow || 0) - expenseAmount;
                } else {
                  monthData.mandatoryExpenses += expenseAmount;
                  monthData.netCashFlow -= expenseAmount;
                }
              }
            }
            
            // Update the map
            monthlyData.set(monthKey, monthData);
          } catch (err) {
            console.warn("Error processing item for monthly breakdown:", err);
          }
        }
      };
      
      // Process baseline forecast
      processItems(forecast);
      
      // Process scenario forecast if available
      if (scenarioForecast && scenarioForecast.length > 0) {
        processItems(scenarioForecast, true);
      }
      
      // Convert map to array and sort by date
      const result = Array.from(monthlyData.values()).sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      });
      
      return result;
    } catch (error) {
      console.error("Error generating monthly breakdown:", error);
      return [];
    }
  };

  // Add this function to handle balance updates
  const handleBalanceUpdate = async () => {
    if (!user || !financialData.profileData) return;

    const oldBalance = financialData.profileData.currentBalance;
    const edit: BalanceEdit = {
      date: new Date().toISOString(),
      oldBalance,
      newBalance,
      note: balanceNote
    };

    setBalanceEdits(prev => [...prev, edit]);
    // Here you would also update the balance in your database
    // await updateBalance(newBalance);
    
    setIsEditingBalance(false);
    setBalanceNote("");
  };

  // Modify the applyScenario function
  const applyScenario = () => {
    if (authLoading || !isSimulationMode) return;
    
    try {
      generateScenarioForecast();
    } catch (error) {
      console.error("Error applying scenario:", error);
      toast.error("Failed to apply scenario adjustments");
    }
  };
  
  // Modify the resetScenario function
  const resetScenario = () => {
    setIncomeAdjustment(0);
    setExpensesAdjustment(0);
    setSavingsAdjustment(0);
    setUnexpectedExpense(0);
    setUnexpectedIncome(0);
    setScenarioName("Default Scenario");
    setScenarioForecast([]);
  };

  if (authLoading || financialData.loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading your financial data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate totals based on the forecast data
  const getPeriodTotals = () => {
    if (!forecastData.length) {
      return {
        currentAvailable: 0,
        projectedIncome: 0,
        projectedExpenses: 0,
        projectedAvailable: 0
      };
    }

    // Current available is the starting balance
    const currentAvailable = forecastData[0].runningBalance || 0;
    
    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    
    forecastData.forEach(item => {
      if (item.type === 'income') {
        totalIncome += item.amount;
      } else if (item.type === 'bill' || item.type === 'expense') {
        totalExpenses += Math.abs(item.amount);
      }
    });
    
    // Projected available is ending balance
    const projectedAvailable = forecastData[forecastData.length - 1]?.runningBalance || 0;
    
    return {
      currentAvailable,
      projectedIncome: totalIncome,
      projectedExpenses: totalExpenses,
      projectedAvailable
    };
  };

  // Format the data for the chart
  const getForecastChartData = () => {
    // For very large datasets, sample the data to prevent performance issues
    const maxDataPoints = 100;
    let dataToProcess = forecastData;
    
    if (forecastData.length > maxDataPoints) {
      console.log(`Sampling chart data from ${forecastData.length} to ${maxDataPoints} points`);
      // Keep first and last points, then sample the rest evenly
      const first = forecastData.slice(0, 1);
      const last = forecastData.slice(-1);
      const middle = forecastData.slice(1, -1);
      
      // Calculate sampling interval
      const step = Math.floor(middle.length / (maxDataPoints - 2));
      const sampledMiddle = [];
      for (let i = 0; i < middle.length; i += step) {
        sampledMiddle.push(middle[i]);
      }
      
      dataToProcess = [...first, ...sampledMiddle, ...last];
    }
    
    return dataToProcess.map(item => ({
      date: new Date(item.date).toLocaleDateString(),
      balance: item.runningBalance || 0,
      income: item.type === 'income' ? item.amount : 0,
      mandatoryExpenses: item.type === 'expense' && !['Entertainment', 'Personal', 'Dining', 'Shopping'].includes(item.category) ? Math.abs(item.amount) : 0,
      optionalExpenses: item.type === 'expense' && ['Entertainment', 'Personal', 'Dining', 'Shopping'].includes(item.category) ? Math.abs(item.amount) : 0,
      projectedBalance: item.runningBalance || 0
    }));
  };

  const totals = getPeriodTotals();
  const chartData = getForecastChartData();

  // Calculate the forecast period end date
  const getEndDateLabel = () => {
    const date = new Date();
    let months = 3;

    switch (forecastPeriod) {
      case "1m": months = 1; break;
      case "3m": months = 3; break;
      case "6m": months = 6; break;
      case "12m": months = 12; break;
    }

    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cash Flow Forecast</h1>
            <p className="text-muted-foreground">
              Predict your future financial position based on income and expenses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-4 justify-end mb-2">
              <div className="text-sm text-muted-foreground">Timeframe:</div>
              <SelectGroup className="flex space-x-1">
                <Button
                  variant={forecastPeriod === "1m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForecastPeriod("1m")}
                >
                  1 Month
                </Button>
                <Button
                  variant={forecastPeriod === "3m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForecastPeriod("3m")}
                >
                  3 Months
                </Button>
                <Button
                  variant={forecastPeriod === "6m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForecastPeriod("6m")}
                >
                  6 Months
                </Button>
                <Button
                  variant={forecastPeriod === "12m" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForecastPeriod("12m")}
                >
                  1 Year
                </Button>
              </SelectGroup>
            </div>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() => {
                    setNewBalance(financialData.profileData?.currentBalance || 0);
                    setIsEditingBalance(true);
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(financialData.profileData?.currentBalance || 0)}</div>
              <p className="text-xs text-muted-foreground">Last updated: {new Date(financialData.profileData?.lastUpdated || Date.now()).toLocaleDateString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Income</CardTitle>
              <ArrowUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">${totals.projectedIncome}</div>
                {scenarioForecast.length > 0 && (
                  <div className="text-sm text-emerald-500">
                    ${(parseFloat(totals.projectedIncome) * (1 + incomeAdjustment / 100)).toFixed(2)} (Scenario)
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Next {forecastPeriod === "1m" ? "month" : forecastPeriod === "12m" ? "year" : forecastPeriod.replace("m", " months")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Expenses</CardTitle>
              <ArrowDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">${totals.projectedExpenses}</div>
                {scenarioForecast.length > 0 && (
                  <div className="text-sm text-rose-500">
                    ${(parseFloat(totals.projectedExpenses) * (1 + expensesAdjustment / 100)).toFixed(2)} (Scenario)
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Next {forecastPeriod === "1m" ? "month" : forecastPeriod === "12m" ? "year" : forecastPeriod.replace("m", " months")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ending Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">${totals.projectedAvailable}</div>
                {scenarioForecast.length > 0 && (
                  <div className="text-sm text-emerald-500">
                    ${scenarioForecast[scenarioForecast.length - 1]?.runningBalance?.toFixed(2) ?? 0} (Scenario)
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Projected for {getEndDateLabel()}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Cash Flow Projection</CardTitle>
                <CardDescription>How your balance is expected to change over time</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="optional-expenses"
                    checked={includeOptionalExpenses}
                    onCheckedChange={setIncludeOptionalExpenses}
                  />
                  <Label htmlFor="optional-expenses">Include optional expenses</Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-80">
            {forecastData.length > 0 ? (
              <ForecastChart
                baselineData={forecastData}
                scenarioData={scenarioForecast}
                className="h-full w-full"
                timeFrame={forecastPeriod}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/30" />
                  <p className="mt-2 text-muted-foreground">
                    Add income and expenses to see your forecast
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Monthly Breakdown</CardTitle>
                  <CardDescription>Net cashflow by month for the next 12 months</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyBreakdown.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarCheck className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-2 text-muted-foreground">
                      Add income and expenses to see your monthly breakdown
                    </p>
                  </div>
                ) : (
                  monthlyBreakdown.map((month, index) => {
                    const isPositiveCashflow = month.netCashFlow >= 0;
                    const isScenarioPositive = month.scenarioNetCashFlow ? month.scenarioNetCashFlow >= 0 : true;
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{month.month}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${
                              isPositiveCashflow
                                ? 'text-emerald-500'
                                : 'text-rose-500'
                            }`}>
                              {isPositiveCashflow ? '+' : ''}{formatCurrency(month.netCashFlow)}
                            </span>
                            {month.scenarioNetCashFlow !== undefined && (
                              <span className={`text-sm font-semibold ${
                                isScenarioPositive
                                  ? 'text-emerald-500'
                                  : 'text-rose-500'
                              }`}>
                                ({isScenarioPositive ? '+' : ''}{formatCurrency(month.scenarioNetCashFlow)})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Income: <span className="font-medium text-emerald-500">+{formatCurrency(month.income)}</span>
                              {month.scenarioIncome !== undefined && (
                                <span className="ml-1 text-xs text-emerald-500">
                                  ({formatCurrency(month.scenarioIncome)})
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Expenses: <span className="font-medium text-rose-500">-{formatCurrency(month.mandatoryExpenses + (includeOptionalExpenses ? month.optionalExpenses : 0))}</span>
                              {(month.scenarioMandatoryExpenses !== undefined || month.scenarioOptionalExpenses !== undefined) && (
                                <span className="ml-1 text-xs text-rose-500">
                                  ({formatCurrency((month.scenarioMandatoryExpenses || 0) + (includeOptionalExpenses ? (month.scenarioOptionalExpenses || 0) : 0))})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <Progress
                          value={isPositiveCashflow ? 100 : (month.income / (month.mandatoryExpenses + month.optionalExpenses + 0.01)) * 100}
                          className={`h-2 ${isPositiveCashflow ? 'bg-emerald-100' : 'bg-rose-100'} [&>div]:${isPositiveCashflow ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Scenario Simulation</CardTitle>
                    <CardDescription>Test different financial scenarios</CardDescription>
                  </div>
                  <Switch
                    checked={isSimulationMode}
                    onCheckedChange={(checked) => {
                      setIsSimulationMode(checked);
                      if (checked) {
                        generateScenarioForecast();
                      } else {
                        setScenarioForecast([]);
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {!isSimulationMode ? (
                  <div className="text-center py-6">
                    <LineChart className="h-12 w-12 mx-auto text-muted-foreground/30" />
                    <p className="mt-2 text-muted-foreground">
                      Toggle the switch to enable scenario simulation
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="scenario-name">Scenario Name</Label>
                      <Input
                        id="scenario-name"
                        value={scenarioName}
                        onChange={(e) => setScenarioName(e.target.value)}
                        placeholder="My Financial Scenario"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="income-adjustment">
                        Income Adjustment (%)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="income-adjustment"
                          type="number"
                          value={incomeAdjustment}
                          onChange={(e) => setIncomeAdjustment(parseFloat(e.target.value) || 0)}
                          min="-100"
                          max="100"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {incomeAdjustment > 0
                          ? `Increases all income by ${incomeAdjustment}%`
                          : incomeAdjustment < 0
                          ? `Decreases all income by ${Math.abs(incomeAdjustment)}%`
                          : "No adjustment to income"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="expenses-adjustment">
                        Expenses Adjustment (%)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="expenses-adjustment"
                          type="number"
                          value={expensesAdjustment}
                          onChange={(e) => setExpensesAdjustment(parseFloat(e.target.value) || 0)}
                          min="-100"
                          max="100"
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {expensesAdjustment > 0
                          ? `Increases all expenses by ${expensesAdjustment}%`
                          : expensesAdjustment < 0
                          ? `Decreases all expenses by ${Math.abs(expensesAdjustment)}%`
                          : "No adjustment to expenses"}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label htmlFor="savings-adjustment">
                        Monthly Savings Increase
                      </Label>
                      <div className="flex items-center gap-2">
                        <span>$</span>
                        <Input
                          id="savings-adjustment"
                          type="number"
                          value={savingsAdjustment}
                          onChange={(e) => setSavingsAdjustment(parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {savingsAdjustment > 0
                          ? `Adding $${savingsAdjustment} in monthly savings`
                          : "No additional savings"}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unexpected-expense">
                        One-time Unexpected Expense
                      </Label>
                      <div className="flex items-center gap-2">
                        <span>$</span>
                        <Input
                          id="unexpected-expense"
                          type="number"
                          value={unexpectedExpense}
                          onChange={(e) => setUnexpectedExpense(parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="unexpected-income">
                        One-time Unexpected Income
                      </Label>
                      <div className="flex items-center gap-2">
                        <span>$</span>
                        <Input
                          id="unexpected-income"
                          type="number"
                          value={unexpectedIncome}
                          onChange={(e) => setUnexpectedIncome(parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={resetScenario}>
                        Reset
                      </Button>
                      <Button onClick={applyScenario}>
                        Apply Scenario
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add balance edit dialog */}
        <Dialog open={isEditingBalance} onOpenChange={setIsEditingBalance}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Current Balance</DialogTitle>
              <DialogDescription>
                Update your current balance and optionally add a note to explain the change.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-balance">New Balance</Label>
                <Input
                  id="new-balance"
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(parseFloat(e.target.value) || 0)}
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance-note">Note (Optional)</Label>
                <Input
                  id="balance-note"
                  value={balanceNote}
                  onChange={(e) => setBalanceNote(e.target.value)}
                  placeholder="Reason for the balance update"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingBalance(false)}>
                Cancel
              </Button>
              <Button onClick={handleBalanceUpdate}>
                Update Balance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
