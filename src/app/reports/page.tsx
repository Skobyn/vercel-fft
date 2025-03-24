"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, PieChart, BarChart3, LineChart as LineChartIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { IncomeExpensesChart } from "@/components/reports/income-expenses-chart";
import { CategoryPieChart } from "@/components/reports/category-pie-chart";
import { SpendingTrendsChart } from "@/components/reports/spending-trends-chart";
import { useRouter } from "next/navigation";
import { useAuth } from '@/providers/firebase-auth-provider';

// Mock data for reports
const incomeData = [
  { month: "Jan", amount: 4200 },
  { month: "Feb", amount: 4200 },
  { month: "Mar", amount: 4500 },
  { month: "Apr", amount: 4200 },
  { month: "May", amount: 4200 },
  { month: "Jun", amount: 4800 },
];

const expenseData = [
  { month: "Jan", amount: 3100 },
  { month: "Feb", amount: 3300 },
  { month: "Mar", amount: 3250 },
  { month: "Apr", amount: 3400 },
  { month: "May", amount: 3200 },
  { month: "Jun", amount: 3350 },
];

const categoryData = [
  { name: "Housing", amount: 1200, percentage: 36.9 },
  { name: "Food & Dining", amount: 450, percentage: 13.8 },
  { name: "Transportation", amount: 350, percentage: 10.8 },
  { name: "Utilities", amount: 250, percentage: 7.7 },
  { name: "Entertainment", amount: 200, percentage: 6.2 },
  { name: "Healthcare", amount: 180, percentage: 5.5 },
  { name: "Shopping", amount: 320, percentage: 9.8 },
  { name: "Other", amount: 300, percentage: 9.2 },
];

const monthlyBalanceData = [
  { month: "Jan", income: 4200, expenses: 3100, savings: 1100 },
  { month: "Feb", income: 4200, expenses: 3300, savings: 900 },
  { month: "Mar", income: 4500, expenses: 3250, savings: 1250 },
  { month: "Apr", income: 4200, expenses: 3400, savings: 800 },
  { month: "May", income: 4200, expenses: 3200, savings: 1000 },
  { month: "Jun", income: 4800, expenses: 3350, savings: 1450 },
];

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<string>("6m");
  const [selectedYear, setSelectedYear] = useState<string>("2025");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  const getCategoryColor = (categoryName: string): string => {
    const colorMap: Record<string, string> = {
      "Housing": "#4338ca", // indigo
      "Food & Dining": "#16a34a", // green
      "Transportation": "#d97706", // amber
      "Utilities": "#9333ea", // purple
      "Entertainment": "#e11d48", // rose
      "Healthcare": "#0891b2", // cyan
      "Shopping": "#db2777", // pink
      "Other": "#6b7280", // gray
    };

    return colorMap[categoryName] || "#6b7280";
  };

  // Generate trend data for the spending trends chart
  const generateTrendData = () => {
    const today = new Date();
    const trendData = [];
    let lastAmount = 3000 + Math.random() * 500;

    for (let i = 180; i >= 0; i -= 30) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      // Add some randomness to the data
      const change = (Math.random() - 0.5) * 500;
      lastAmount = Math.max(2000, lastAmount + change);

      trendData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.round(lastAmount * 100) / 100,
        movingAverage: 0, // Placeholder, will calculate below
      });
    }

    // Calculate 3-point moving average
    for (let i = 0; i < trendData.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - 1); j <= Math.min(trendData.length - 1, i + 1); j++) {
        sum += trendData[j].amount;
        count++;
      }

      trendData[i].movingAverage = Math.round((sum / count) * 100) / 100;
    }

    return trendData;
  };

  const trendData = generateTrendData();

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-muted-foreground">
              Analyze your spending patterns and financial trends
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">3 Months</SelectItem>
                <SelectItem value="6m">6 Months</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$26,100.00</div>
              <p className="text-xs text-muted-foreground">
                Last 6 months
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$19,600.00</div>
              <p className="text-xs text-muted-foreground">
                Last 6 months
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$6,500.00</div>
              <p className="text-xs text-muted-foreground">
                Last 6 months
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24.9%</div>
              <p className="text-xs text-muted-foreground">
                Of total income
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="trends">Patterns & Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Income vs. Expenses</CardTitle>
                <CardDescription>
                  Track your income, expenses, and savings over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <IncomeExpensesChart data={monthlyBalanceData} />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Balance</CardTitle>
                  <CardDescription>
                    Your monthly financial summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyBalanceData.map((data) => (
                      <div key={data.month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{data.month} 2025</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${data.savings >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {data.savings >= 0 ? '+' : ''}{data.savings.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <div>
                            <span className="text-muted-foreground">Income: </span>
                            <span className="font-medium">${data.income.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Expenses: </span>
                            <span className="font-medium">${data.expenses.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${Math.max((data.savings / data.income) * 100, 0)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>
                    Your top expense categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex h-40 items-center justify-center mb-6">
                    <CategoryPieChart
                      data={categoryData.map(category => ({
                        name: category.name,
                        value: category.amount,
                        percentage: category.percentage,
                        color: getCategoryColor(category.name),
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    {categoryData.slice(0, 5).map((category) => (
                      <div key={category.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-primary`} style={{ opacity: 0.5 + (0.5 * (5 - categoryData.indexOf(category)) / 5) }} />
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium">${category.amount}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {category.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Income Analysis</CardTitle>
                <CardDescription>
                  Track your income sources and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <LineChartIcon className="h-16 w-16 text-muted-foreground" />
                  <p className="ml-4 text-muted-foreground">
                    Line chart showing income trends would be rendered here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Expense Analysis</CardTitle>
                <CardDescription>
                  Visualize your spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <div className="flex h-full items-center justify-center">
                  <BarChart3 className="h-16 w-16 text-muted-foreground" />
                  <p className="ml-4 text-muted-foreground">
                    Bar chart showing expense breakdown would be rendered here
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expense Categories</CardTitle>
                    <CardDescription>
                      Breakdown of spending by category
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{category.name}</h4>
                        <div className="text-right">
                          <span className="font-medium">${category.amount.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {category.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Trends</CardTitle>
                <CardDescription>
                  Long-term trends and patterns in your finances
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <SpendingTrendsChart />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Reports
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
