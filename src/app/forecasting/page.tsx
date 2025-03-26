"use client";

import { useEffect } from "react";
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
  id: number;
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
};

export default function ForecastingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile, incomes, bills, loading: dataLoading } = useFinancialData();
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);

  const [forecastPeriod, setForecastPeriod] = useState<string>("3m");
  const [includeOptionalExpenses, setIncludeOptionalExpenses] = useState<boolean>(true);
  const [openAddIncomeDialog, setOpenAddIncomeDialog] = useState(false);
  const [openAddExpenseDialog, setOpenAddExpenseDialog] = useState(false);
  
  // Placeholder for optional expenses - in the future, this would come from the database
  const optionalExpenses = [
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
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [loading, user, router]);

  // Generate forecast data when dependencies change
  useEffect(() => {
    if (loading || dataLoading || !profile?.profile) return;

    try {
      const days = forecastPeriod === "1m" ? 30 : 
                   forecastPeriod === "3m" ? 90 :
                   forecastPeriod === "6m" ? 180 : 365;
      
      // Generate forecast data using the utility function
      const forecast = generateCashFlowForecast(
        profile.profile.currentBalance,
        incomes.incomes || [],
        bills.bills || [],
        [], // No balance adjustments for this view
        days
      );
      
      setForecastData(forecast);
    } catch (error) {
      console.error("Error generating forecast:", error);
      // Create minimal forecast with current balance as fallback
      if (profile?.profile) {
        setForecastData([{
          itemId: 'initial-balance',
          date: new Date().toISOString(),
          amount: profile.profile.currentBalance || 0,
          category: 'balance',
          name: 'Current Balance',
          type: 'balance',
          runningBalance: profile.profile.currentBalance || 0
        }]);
      }
    }
  }, [forecastPeriod, profile, incomes, bills, loading, dataLoading]);

  if (loading || dataLoading) {
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
        endingBalance: profile?.profile?.currentBalance?.toFixed(2) || "0.00"
      };
    }

    // Get starting balance (current balance)
    const startingBalance = profile?.profile?.currentBalance || 0;
    
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
              <CardTitle className="text-sm font-medium">Starting Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(profile?.profile?.currentBalance || 0)}</div>
              <p className="text-xs text-muted-foreground">As of today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Income</CardTitle>
              <ArrowUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.projectedIncome}</div>
              <p className="text-xs text-muted-foreground">Next {forecastPeriod === "1m" ? "month" : forecastPeriod === "12m" ? "year" : forecastPeriod.replace("m", " months")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected Expenses</CardTitle>
              <ArrowDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.projectedExpenses}</div>
              <p className="text-xs text-muted-foreground">Next {forecastPeriod === "1m" ? "month" : forecastPeriod === "12m" ? "year" : forecastPeriod.replace("m", " months")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ending Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.endingBalance}</div>
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
            {chartData.length > 0 ? (
              <ForecastChart
                data={chartData}
                includeOptionalExpenses={includeOptionalExpenses}
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
                  <CardDescription>Projected cash flow by month</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {forecastData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          item.amount >= 0
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                        }`}>
                          {item.amount >= 0 ? `+${item.amount.toFixed(2)}` : item.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Starting: <span className="font-medium">${item.runningBalance?.toFixed(2) || "0.00"}</span></p>
                        <p className="text-muted-foreground">Income: <span className="font-medium text-emerald-500">+{item.amount >= 0 ? item.amount.toFixed(2) : ""}</span></p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mandatory: <span className="font-medium text-rose-500">-{Math.abs(item.amount).toFixed(2)}</span></p>
                        {includeOptionalExpenses && (
                          <p className="text-muted-foreground">Optional: <span className="font-medium text-amber-500">-{Math.abs(item.amount).toFixed(2)}</span></p>
                        )}
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.min(100, (item.runningBalance || 0 / (item.runningBalance || 0 + item.amount)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Ending Balance: <span className="font-medium">${(
                        includeOptionalExpenses
                          ? item.runningBalance || 0
                          : item.runningBalance || 0 + item.amount
                      ).toFixed(2)}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expected Income</CardTitle>
                    <CardDescription>Upcoming income and deposits</CardDescription>
                  </div>
                  <Dialog open={openAddIncomeDialog} onOpenChange={setOpenAddIncomeDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Income
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Expected Income</DialogTitle>
                        <DialogDescription>
                          Add an expected income or deposit to your forecast.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="income-name">Description</Label>
                          <Input id="income-name" placeholder="e.g., Salary, Freelance Payment" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="income-amount">Amount</Label>
                            <Input id="income-amount" placeholder="0.00" type="number" />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="income-date">Date</Label>
                            <Input id="income-date" type="date" />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="income-frequency">Frequency</Label>
                          <Select>
                            <SelectTrigger id="income-frequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once">One-time</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenAddIncomeDialog(false)}>Cancel</Button>
                        <Button>Add Income</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incomes.incomes.map((income) => (
                    <div key={income.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <ArrowUp className="h-4 w-4 text-emerald-500" />
                          <p className="font-medium">{income.name}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarClock className="h-3 w-3" />
                          <span>{new Date(income.date).toLocaleDateString()} ({income.frequency})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-emerald-500">+${income.amount.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expenses</CardTitle>
                    <CardDescription>Mandatory and optional expenses</CardDescription>
                  </div>
                  <Tabs defaultValue="mandatory" className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="mandatory">Mandatory</TabsTrigger>
                      <TabsTrigger value="optional">Optional</TabsTrigger>
                    </TabsList>

                    <TabsContent value="mandatory" className="pt-4">
                      <div className="flex justify-end mb-2">
                        <Dialog open={openAddExpenseDialog} onOpenChange={setOpenAddExpenseDialog}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Add Expense
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Mandatory Expense</DialogTitle>
                              <DialogDescription>
                                Add a required expense or bill to your forecast.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="expense-name">Description</Label>
                                <Input id="expense-name" placeholder="e.g., Rent, Utilities" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="expense-amount">Amount</Label>
                                  <Input id="expense-amount" placeholder="0.00" type="number" />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="expense-date">Due Date</Label>
                                  <Input id="expense-date" type="date" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="expense-frequency">Frequency</Label>
                                  <Select>
                                    <SelectTrigger id="expense-frequency">
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="once">One-time</SelectItem>
                                      <SelectItem value="monthly">Monthly</SelectItem>
                                      <SelectItem value="quarterly">Quarterly</SelectItem>
                                      <SelectItem value="annual">Annual</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="expense-category">Category</Label>
                                  <Select>
                                    <SelectTrigger id="expense-category">
                                      <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="housing">Housing</SelectItem>
                                      <SelectItem value="utilities">Utilities</SelectItem>
                                      <SelectItem value="transport">Transportation</SelectItem>
                                      <SelectItem value="insurance">Insurance</SelectItem>
                                      <SelectItem value="debt">Debt Payments</SelectItem>
                                      <SelectItem value="food">Groceries</SelectItem>
                                      <SelectItem value="healthcare">Healthcare</SelectItem>
                                      <SelectItem value="taxes">Taxes</SelectItem>
                                      <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setOpenAddExpenseDialog(false)}>Cancel</Button>
                              <Button>Add Expense</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="max-h-80 overflow-y-auto space-y-4">
                        {bills.bills.map((expense) => (
                          <div key={expense.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-rose-500" />
                                <p className="font-medium">{expense.name}</p>
                              </div>
                              <div className="flex flex-col xs:flex-row xs:items-center gap-x-2 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <CalendarClock className="h-3 w-3" />
                                  <span>{new Date(expense.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="hidden xs:inline">•</span>
                                  <Badge variant="secondary" className="text-xs">{expense.category}</Badge>
                                  <Badge variant="secondary" className="text-xs">{expense.frequency}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-rose-500">-${expense.amount.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="optional" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">Add optional expenses to your forecast</p>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Optional
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Optional expenses are included based on likelihood and priority
                        </p>
                      </div>

                      <div className="max-h-60 overflow-y-auto space-y-4">
                        {optionalExpenses.map((expense) => (
                          <div key={expense.id} className="space-y-2 border-b pb-3 last:border-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant={expense.isPriority ? "default" : "outline"} className="text-xs">{expense.isPriority ? "Priority" : "Optional"}</Badge>
                                <p className="font-medium">{expense.name}</p>
                              </div>
                              <p className="font-semibold text-amber-500">-${expense.amount.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <Badge variant="secondary" className="text-xs">{expense.category}</Badge>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Likelihood:</span>
                                <span className="font-medium">{expense.likelihood}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${expense.likelihood > 70 ? 'bg-emerald-500' : expense.likelihood > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${expense.likelihood}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
