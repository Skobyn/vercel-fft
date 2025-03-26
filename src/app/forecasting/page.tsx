"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CalendarCheck
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
  startingBalance: number;
  income: number;
  mandatoryExpenses: number;
  optionalExpenses: number;
  endingBalance: number;
  scenarioIncome?: number;
  scenarioMandatoryExpenses?: number;
  scenarioOptionalExpenses?: number;
  scenarioEndingBalance?: number;
};

// Add these types near the top with other type definitions
type BalanceEdit = {
  date: string;
  oldBalance: number;
  newBalance: number;
  note?: string;
};

export default function ForecastingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const financialData = useFinancialData();
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyForecast[]>([]);

  const [forecastPeriod, setForecastPeriod] = useState<string>("3m");
  const [includeOptionalExpenses, setIncludeOptionalExpenses] = useState<boolean>(true);
  const [openAddIncomeDialog, setOpenAddIncomeDialog] = useState(false);
  const [openAddExpenseDialog, setOpenAddExpenseDialog] = useState(false);
  
  // Use ref to track last successful generation to prevent infinite loops
  const lastGenerationRef = useRef<{
    balanceId: string | null;
    incomesCount: number;
    billsCount: number;
    forecastPeriod: string;
  }>({
    balanceId: null,
    incomesCount: 0,
    billsCount: 0,
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

  // Add new state for scenario simulations
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [scenarioName, setScenarioName] = useState("Default Scenario");
  const [incomeAdjustment, setIncomeAdjustment] = useState(0);
  const [expensesAdjustment, setExpensesAdjustment] = useState(0);
  const [savingsAdjustment, setSavingsAdjustment] = useState(0);
  const [unexpectedExpense, setUnexpectedExpense] = useState(0);
  const [unexpectedExpenseDate, setUnexpectedExpenseDate] = useState<Date | undefined>(undefined);
  const [scenarioForecast, setScenarioForecast] = useState<ForecastItem[]>([]);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [balanceNote, setBalanceNote] = useState<string>("");
  const [balanceEdits, setBalanceEdits] = useState<BalanceEdit[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [authLoading, user, router]);

  // Generate forecast data and monthly breakdown
  useEffect(() => {
    // Don't do anything if still loading
    if (authLoading || financialData.loading || !financialData.profileData) return;

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
      lastGenerationRef.current.forecastPeriod !== forecastPeriod;
    
    // Skip generation if data is the same as before
    if (!shouldRegenerateForcecast && forecastData.length > 0) {
      return;
    }

    try {
      const days = forecastPeriod === "1m" ? 30 : 
                   forecastPeriod === "3m" ? 90 :
                   forecastPeriod === "6m" ? 180 : 365;
      
      // Generate forecast data using the utility function
      const forecast = generateCashFlowForecast(
        currentBalance,
        incomesArray,
        billsArray,
        financialData.expensesData || [], // Add expenses
        [], // No balance adjustments for this view
        days
      );
      
      // Update the last generation reference
      lastGenerationRef.current = {
        balanceId,
        incomesCount: incomesArray.length,
        billsCount: billsArray.length,
        forecastPeriod
      };
      
      setForecastData(forecast);
      
      // Generate monthly breakdown from forecast data
      generateMonthlyBreakdown(forecast, scenarioForecast);
    } catch (error) {
      console.error("Error generating forecast:", error);
      // Create a minimal forecast with just the current balance
      const minimalForecast: ForecastItem[] = [{
        itemId: 'initial-balance',
        date: new Date().toISOString(),
        amount: financialData.profileData.currentBalance || 0,
        category: 'balance',
        name: 'Current Balance',
        type: 'balance' as const,
        runningBalance: financialData.profileData.currentBalance || 0
      }];
      setForecastData(minimalForecast);
      generateMonthlyBreakdown(minimalForecast, scenarioForecast);
    }
  }, [forecastPeriod, financialData, authLoading, forecastData.length, scenarioForecast]);

  // Function to generate monthly breakdown from forecast data
  const generateMonthlyBreakdown = (forecast: ForecastItem[], scenarioForecast?: ForecastItem[]) => {
    // Initialize 12 months of data
    const months: Record<string, MonthlyForecast> = {};
    const now = new Date();
    
    // Pre-initialize 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      months[monthKey] = {
        month: monthName,
        startingBalance: i === 0 ? (financialData.profileData?.currentBalance || 0) : 0,
        income: 0,
        mandatoryExpenses: 0,
        optionalExpenses: 0,
        endingBalance: 0
      };
    }
    
    // Process baseline forecast
    forecast.forEach(item => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (months[monthKey]) {
        if (item.type === 'income') {
          months[monthKey].income += item.amount;
        } else if (item.type === 'expense' || item.type === 'bill') {
          if (['Entertainment', 'Personal', 'Dining', 'Shopping'].includes(item.category)) {
            months[monthKey].optionalExpenses += Math.abs(item.amount);
          } else {
            months[monthKey].mandatoryExpenses += Math.abs(item.amount);
          }
        }
      }
    });
    
    // Process scenario forecast if available
    if (scenarioForecast?.length) {
      scenarioForecast.forEach(item => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (months[monthKey]) {
          if (item.type === 'income') {
            months[monthKey].scenarioIncome = (months[monthKey].scenarioIncome || 0) + item.amount;
          } else if (item.type === 'expense' || item.type === 'bill') {
            if (['Entertainment', 'Personal', 'Dining', 'Shopping'].includes(item.category)) {
              months[monthKey].scenarioOptionalExpenses = (months[monthKey].scenarioOptionalExpenses || 0) + Math.abs(item.amount);
            } else {
              months[monthKey].scenarioMandatoryExpenses = (months[monthKey].scenarioMandatoryExpenses || 0) + Math.abs(item.amount);
            }
          }
        }
      });
    }
    
    // Calculate running balances for both baseline and scenario
    let runningBalance = financialData.profileData?.currentBalance || 0;
    let scenarioRunningBalance = financialData.profileData?.currentBalance || 0;
    
    Object.values(months).forEach(month => {
      // Baseline calculations
      month.startingBalance = runningBalance;
      month.endingBalance = runningBalance + month.income - month.mandatoryExpenses - (includeOptionalExpenses ? month.optionalExpenses : 0);
      runningBalance = month.endingBalance;
      
      // Scenario calculations if available
      if (scenarioForecast?.length) {
        month.scenarioEndingBalance = scenarioRunningBalance + 
          (month.scenarioIncome || 0) - 
          (month.scenarioMandatoryExpenses || 0) - 
          (includeOptionalExpenses ? (month.scenarioOptionalExpenses || 0) : 0);
        scenarioRunningBalance = month.scenarioEndingBalance;
      }
    });
    
    // Convert to array and sort by month
    const monthlyData = Object.values(months).sort((a, b) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime();
    });
    
    setMonthlyBreakdown(monthlyData);
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
    if (authLoading || financialData.loading || !financialData.profileData) return;
    
    try {
      const days = forecastPeriod === "1m" ? 30 : 
                 forecastPeriod === "3m" ? 90 :
                 forecastPeriod === "6m" ? 180 : 365;
      
      const currentBalance = financialData.profileData?.currentBalance || 0;
      const incomesArray = financialData.incomesData || [];
      const billsArray = financialData.billsData || [];
      
      // Apply income adjustment to all incomes
      const adjustedIncomes = incomesArray.map(income => ({
        ...income,
        amount: income.amount * (1 + incomeAdjustment / 100)
      }));
      
      // Apply expense adjustment to all bills
      const adjustedBills = billsArray.map(bill => ({
        ...bill,
        amount: bill.amount * (1 + expensesAdjustment / 100)
      }));
      
      // Add unexpected expense if specified
      const balanceAdjustments: any[] = [];
      if (unexpectedExpense > 0 && unexpectedExpenseDate) {
        balanceAdjustments.push({
          id: `unexpected-${Date.now()}`,
          date: unexpectedExpenseDate,
          amount: -unexpectedExpense,
          category: 'Unexpected',
          name: 'Unexpected Expense',
          type: 'adjustment',
          reason: 'Unexpected Expense'
        });
      }
      
      // Generate forecast with adjusted values
      const scenarioForecast = generateCashFlowForecast(
        currentBalance,
        adjustedIncomes,
        adjustedBills,
        financialData.expensesData || [],
        balanceAdjustments,
        365 // Always generate 12 months for monthly breakdown
      );
      
      setScenarioForecast(scenarioForecast);
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
    setUnexpectedExpenseDate(undefined);
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
        projectedIncome: "0.00",
        projectedExpenses: "0.00",
        endingBalance: financialData.profileData?.currentBalance?.toFixed(2) || "0.00"
      };
    }

    // Get starting balance (current balance)
    const startingBalance = financialData.profileData?.currentBalance || 0;
    
    // Calculate projected income (sum of all positive amounts)
    const projectedIncome = forecastData
      .filter(item => item.type === 'income')
      .reduce((sum, item) => sum + item.amount, 0);
    
    // Calculate projected expenses (sum of all negative amounts)
    let projectedExpenses = forecastData
      .filter(item => item.type === 'expense')
      .reduce((sum, item) => sum + Math.abs(item.amount), 0);
    
    // If not including optional expenses, reduce the total
    if (!includeOptionalExpenses) {
      // Exclude optional expenses (we'll assume all expenses with category 'Entertainment' or 'Personal' are optional)
      const optionalCategories = ['Entertainment', 'Personal', 'Dining', 'Shopping'];
      const optionalExpenses = forecastData
        .filter(item => item.type === 'expense' && optionalCategories.includes(item.category))
        .reduce((sum, item) => sum + Math.abs(item.amount), 0);
      
      projectedExpenses -= optionalExpenses;
    }
    
    // Get ending balance (last item's running balance)
    const endingBalance = forecastData.length > 0 
      ? forecastData[forecastData.length - 1].runningBalance || startingBalance
      : startingBalance;
    
    return {
      projectedIncome: projectedIncome.toFixed(2),
      projectedExpenses: projectedExpenses.toFixed(2),
      endingBalance: endingBalance.toFixed(2)
    };
  };

  // Format the data for the chart
  const getForecastChartData = () => {
    return forecastData.map(item => ({
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
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Forecast period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1 Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="12m">12 Months</SelectItem>
              </SelectContent>
            </Select>
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
                <div className="text-2xl font-bold">${totals.endingBalance}</div>
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
                    const isPositiveCashflow = month.endingBalance >= 0;
                    const isScenarioPositive = month.scenarioEndingBalance ? month.scenarioEndingBalance >= 0 : true;
                    
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
                              {isPositiveCashflow ? '+' : ''}{formatCurrency(month.endingBalance)}
                            </span>
                            {month.scenarioEndingBalance !== undefined && (
                              <span className={`text-sm font-semibold ${
                                isScenarioPositive
                                  ? 'text-emerald-500'
                                  : 'text-rose-500'
                              }`}>
                                ({isScenarioPositive ? '+' : ''}{formatCurrency(month.scenarioEndingBalance)})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Income: <span className="font-medium text-emerald-500">+{formatCurrency(month.income)}</span>
                              {month.scenarioIncome !== undefined && (
                                <span className="text-emerald-500 ml-1">
                                  (+{formatCurrency(month.scenarioIncome)})
                                </span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Expenses: <span className="font-medium text-rose-500">
                                -{formatCurrency(month.mandatoryExpenses + (includeOptionalExpenses ? month.optionalExpenses : 0))}
                              </span>
                              {month.scenarioMandatoryExpenses !== undefined && (
                                <span className="text-rose-500 ml-1">
                                  (-{formatCurrency(month.scenarioMandatoryExpenses + (includeOptionalExpenses ? (month.scenarioOptionalExpenses || 0) : 0))})
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="mt-1">
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${isPositiveCashflow ? 'bg-emerald-500' : 'bg-rose-500'}`}
                              style={{ 
                                width: `${Math.min(100, Math.abs(month.endingBalance) / (month.income || 1) * 100)}%` 
                              }}
                            />
                            {month.scenarioEndingBalance !== undefined && (
                              <div
                                className={`h-2 rounded-full ${isScenarioPositive ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`}
                                style={{ 
                                  width: `${Math.min(100, Math.abs(month.scenarioEndingBalance) / (month.scenarioIncome || 1) * 100)}%` 
                                }}
                              />
                            )}
                          </div>
                        </div>
                        {month.optionalExpenses > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {includeOptionalExpenses 
                              ? `Includes ${formatCurrency(month.optionalExpenses)} in optional expenses${
                                  month.scenarioOptionalExpenses !== undefined 
                                    ? ` (${formatCurrency(month.scenarioOptionalExpenses)} in scenario)`
                                    : ''
                                }` 
                              : `${formatCurrency(month.optionalExpenses)} in optional expenses not included${
                                  month.scenarioOptionalExpenses !== undefined
                                    ? ` (${formatCurrency(month.scenarioOptionalExpenses)} in scenario)`
                                    : ''
                                }`}
                          </p>
                        )}
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
                    onCheckedChange={setIsSimulationMode}
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
                      {unexpectedExpense > 0 && (
                        <div className="mt-2">
                          <Label htmlFor="unexpected-expense-date">
                            Date of Unexpected Expense
                          </Label>
                          <Input
                            id="unexpected-expense-date"
                            type="date"
                            onChange={(e) => setUnexpectedExpenseDate(e.target.valueAsDate || undefined)}
                          />
                        </div>
                      )}
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

        <div className="grid gap-6 md:grid-cols-2">
          {/* Main forecast chart */}
          <Card className="col-span-2 h-[400px]">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Cash Flow Forecast</CardTitle>
                  <CardDescription>
                    Projected cash flow over the next {forecastPeriod === "1m" ? "month" : forecastPeriod === "3m" ? "3 months" : forecastPeriod === "6m" ? "6 months" : "year"}
                  </CardDescription>
                </div>
                <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 Month</SelectItem>
                    <SelectItem value="3m">3 Months</SelectItem>
                    <SelectItem value="6m">6 Months</SelectItem>
                    <SelectItem value="12m">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ForecastChart 
                  baselineData={forecastData} 
                  scenarioData={scenarioForecast}
                />
              </div>
            </CardContent>
          </Card>
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
