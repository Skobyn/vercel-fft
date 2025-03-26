"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Download, 
  PieChart, 
  BarChart3, 
  LineChart as LineChartIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Share2,
  Filter,
  FileDown,
  FileText,
  Table,
  Settings,
  AlertTriangle,
  Save,
  Plus,
  Sliders,
  FileType
} from "lucide-react";
import { useState, useEffect } from "react";
import { IncomeExpensesChart } from "@/components/reports/income-expenses-chart";
import { CategoryPieChart } from "@/components/reports/category-pie-chart";
import { SpendingTrendsChart } from "@/components/reports/spending-trends-chart";
import { useRouter } from "next/navigation";
import { useAuth } from '@/providers/firebase-auth-provider';
import { useBudgets, useIncomes, useBills, useExpenses } from '@/hooks/use-financial-data';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from '@/utils/financial-utils';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Define the report types for the UI
type ReportType = "overview" | "income-vs-expenses" | "category-breakdown" | "spending-trends" | "transactions" | "budget-analysis" | "custom";

// Define custom report settings interface
interface CustomReportSettings {
  title: string;
  description: string;
  includeSections: {
    summary: boolean;
    incomeVsExpenses: boolean;
    categoryBreakdown: boolean;
    spendingTrends: boolean;
    transactions: boolean;
    budgetComparison: boolean;
  };
  filters: {
    categories: string[];
    excludeCategories: string[];
    minAmount: number | null;
    maxAmount: number | null;
  };
}

// Function to download reports as different formats
const downloadReport = (type: 'csv' | 'pdf' | 'excel') => {
  // This would be implemented with a proper export library
  toast.success(`Report downloaded as ${type.toUpperCase()}`);
};

export default function ReportsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Financial data hooks
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { incomes, loading: incomesLoading } = useIncomes();
  const { bills, loading: billsLoading } = useBills();
  const { expenses, loading: expensesLoading } = useExpenses();
  
  // UI state
  const [activeTab, setActiveTab] = useState<ReportType>("overview");
  const [dateRange, setDateRange] = useState({
    from: subMonths(new Date(), 6),
    to: new Date()
  });
  const [selectedPeriod, setSelectedPeriod] = useState<string>("6m");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [customReportDialogOpen, setCustomReportDialogOpen] = useState(false);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  
  // Custom report state
  const [customReportSettings, setCustomReportSettings] = useState<CustomReportSettings>({
    title: "My Custom Report",
    description: "Personal financial analysis",
    includeSections: {
      summary: true,
      incomeVsExpenses: true,
      categoryBreakdown: true,
      spendingTrends: true,
      transactions: false,
      budgetComparison: true
    },
    filters: {
      categories: [],
      excludeCategories: [],
      minAmount: null,
      maxAmount: null
    }
  });

  // Mock data for reports (will be replaced with real data)
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

  // Get all unique expense categories for filtering
  const allCategories = Array.from(
    new Set([
      ...categoryData.map(cat => cat.name),
      // Add additional categories from actual data when available
    ])
  );

  const monthlyBalanceData = [
    { month: "Jan", income: 4200, expenses: 3100, savings: 1100 },
    { month: "Feb", income: 4200, expenses: 3300, savings: 900 },
    { month: "Mar", income: 4500, expenses: 3250, savings: 1250 },
    { month: "Apr", income: 4200, expenses: 3400, savings: 800 },
    { month: "May", income: 4200, expenses: 3200, savings: 1000 },
    { month: "Jun", income: 4800, expenses: 3350, savings: 1450 },
  ];

  // Calculate summary data
  const totalIncome = monthlyBalanceData.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = monthlyBalanceData.reduce((sum, month) => sum + month.expenses, 0);
  const totalSavings = monthlyBalanceData.reduce((sum, month) => sum + month.savings, 0);
  const savingsRate = Math.round((totalSavings / totalIncome) * 100);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [authLoading, user, router]);

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

  // Transaction data with anomalies
  const transactionData = [
    { id: 1, date: "2023-06-01", description: "Groceries", category: "Food & Dining", amount: 120.50 },
    { id: 2, date: "2023-06-03", description: "Gas Station", category: "Transportation", amount: 45.00 },
    { id: 3, date: "2023-06-05", description: "Internet Bill", category: "Utilities", amount: 75.99 },
    { id: 4, date: "2023-06-07", description: "Restaurant", category: "Food & Dining", amount: 85.50, isAnomaly: true },
    { id: 5, date: "2023-06-10", description: "Electronics Store", category: "Shopping", amount: 299.99, isAnomaly: true },
    { id: 6, date: "2023-06-15", description: "Rent", category: "Housing", amount: 1200.00 },
    { id: 7, date: "2023-06-18", description: "Doctor Visit", category: "Healthcare", amount: 150.00 },
    { id: 8, date: "2023-06-22", description: "Movie Tickets", category: "Entertainment", amount: 32.00 },
    { id: 9, date: "2023-06-25", description: "Electric Bill", category: "Utilities", amount: 110.25 },
    { id: 10, date: "2023-06-28", description: "Grocery Store", category: "Food & Dining", amount: 95.40 }
  ];

  // Budget vs actual data for analysis
  const budgetVsActualData = [
    { category: "Housing", budgeted: 1200, actual: 1200, variance: 0 },
    { category: "Food & Dining", budgeted: 400, actual: 450, variance: 50 },
    { category: "Transportation", budgeted: 300, actual: 350, variance: 50 },
    { category: "Utilities", budgeted: 250, actual: 250, variance: 0 },
    { category: "Entertainment", budgeted: 150, actual: 200, variance: 50 },
    { category: "Healthcare", budgeted: 200, actual: 180, variance: -20 },
    { category: "Shopping", budgeted: 200, actual: 320, variance: 120 },
    { category: "Other", budgeted: 250, actual: 300, variance: 50 }
  ];

  // Filter transactions based on current filters
  const filteredTransactions = transactionData.filter(transaction => {
    if (categoryFilter.length > 0 && !categoryFilter.includes(transaction.category)) {
      return false;
    }
    
    const transactionAmount = transaction.amount;
    const minAmountValue = minAmount ? parseFloat(minAmount) : null;
    const maxAmountValue = maxAmount ? parseFloat(maxAmount) : null;
    
    if (minAmountValue !== null && transactionAmount < minAmountValue) {
      return false;
    }
    
    if (maxAmountValue !== null && transactionAmount > maxAmountValue) {
      return false;
    }
    
    if (!showAnomalies && transaction.isAnomaly) {
      return false;
    }
    
    return true;
  });

  const trendData = generateTrendData();

  if (authLoading || budgetsLoading || incomesLoading || billsLoading || expensesLoading) {
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

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
            <p className="text-muted-foreground">
              Analyze your spending patterns and financial trends
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePicker
              date={{
                from: dateRange.from,
                to: dateRange.to
              }}
              onDateChange={(newRange) => {
                if (newRange.from && newRange.to) {
                  setDateRange({
                    from: newRange.from,
                    to: newRange.to
                  });
                }
              }}
            />
            
            <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Filters</DialogTitle>
                  <DialogDescription>
                    Customize filters to focus on specific data
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Categories</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {allCategories.map(category => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`category-${category}`} 
                            checked={categoryFilter.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCategoryFilter([...categoryFilter, category]);
                              } else {
                                setCategoryFilter(categoryFilter.filter(c => c !== category));
                              }
                            }}
                          />
                          <Label htmlFor={`category-${category}`}>{category}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-amount">Min Amount</Label>
                      <Input 
                        id="min-amount" 
                        placeholder="0.00" 
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-amount">Max Amount</Label>
                      <Input 
                        id="max-amount" 
                        placeholder="1000.00" 
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="show-anomalies" 
                      checked={showAnomalies}
                      onCheckedChange={setShowAnomalies}
                    />
                    <Label htmlFor="show-anomalies">Show Spending Anomalies</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setCategoryFilter([]);
                    setMinAmount("");
                    setMaxAmount("");
                    setShowAnomalies(true);
                  }}>
                    Reset Filters
                  </Button>
                  <Button onClick={() => setFilterDialogOpen(false)}>Apply Filters</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadReport('pdf')}>
                  <FileType className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadReport('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadReport('excel')}>
                  <Table className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)}>
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="income-vs-expenses">Income vs Expenses</TabsTrigger>
              <TabsTrigger value="category-breakdown">Categories</TabsTrigger>
              <TabsTrigger value="spending-trends">Trends</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="budget-analysis">Budget Analysis</TabsTrigger>
              <TabsTrigger value="custom">
                <Plus className="h-3 w-3 mr-1" />
                Custom Report
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Dashboard Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 6 months
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 6 months
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 6 months
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{savingsRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Of total income
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Income vs. Expenses</CardTitle>
                  <CardDescription>Monthly comparison over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <IncomeExpensesChart data={monthlyBalanceData} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>Where your money goes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <CategoryPieChart data={categoryData} />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Anomaly Detection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Spending Anomalies
                </CardTitle>
                <CardDescription>Unusual transactions that might need attention</CardDescription>
              </CardHeader>
              <CardContent>
                {transactionData.filter(t => t.isAnomaly).length > 0 ? (
                  <div className="space-y-4">
                    {transactionData.filter(t => t.isAnomaly).map(anomaly => (
                      <div key={anomaly.id} className="border rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center">
                            {anomaly.description}
                            <Badge variant="outline" className="ml-2">{anomaly.category}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{anomaly.date}</div>
                        </div>
                        <div className="font-bold text-red-500">{formatCurrency(anomaly.amount)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No spending anomalies detected in the selected period.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Income vs. Expenses Tab */}
          <TabsContent value="income-vs-expenses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Income vs. Expenses Comparison</CardTitle>
                <CardDescription>Detailed monthly breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <IncomeExpensesChart data={monthlyBalanceData} />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Income</CardTitle>
                  <CardDescription>Income sources by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {incomeData.map((month, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="font-medium">{month.month}</div>
                        <div className="font-bold text-green-600">{formatCurrency(month.amount)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Expenses</CardTitle>
                  <CardDescription>Total expenses by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expenseData.map((month, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div className="font-medium">{month.month}</div>
                        <div className="font-bold text-red-500">{formatCurrency(month.amount)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Category Breakdown Tab */}
          <TabsContent value="category-breakdown" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>Distribution of expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <CategoryPieChart data={categoryData} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
                <CardDescription>Detailed view of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: getCategoryColor(category.name) }}
                      />
                      <div className="flex-1">{category.name}</div>
                      <div className="flex-1 text-right font-medium">{formatCurrency(category.amount)}</div>
                      <div className="w-16 text-right font-medium">{category.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Spending Trends Tab */}
          <TabsContent value="spending-trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Spending Trend Analysis</CardTitle>
                <CardDescription>6-month spending pattern with trend line</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <SpendingTrendsChart data={trendData} />
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Increasing Categories</CardTitle>
                  <CardDescription>Categories with growing expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-red-500" />
                        <span>Entertainment</span>
                      </div>
                      <div className="font-bold">+24%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-red-500" />
                        <span>Food & Dining</span>
                      </div>
                      <div className="font-bold">+12%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2 text-red-500" />
                        <span>Shopping</span>
                      </div>
                      <div className="font-bold">+8%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Decreasing Categories</CardTitle>
                  <CardDescription>Categories with reduced expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-2 text-green-500" />
                        <span>Transportation</span>
                      </div>
                      <div className="font-bold">-15%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-2 text-green-500" />
                        <span>Utilities</span>
                      </div>
                      <div className="font-bold">-7%</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <TrendingDown className="h-4 w-4 mr-2 text-green-500" />
                        <span>Healthcare</span>
                      </div>
                      <div className="font-bold">-5%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Details</CardTitle>
                <CardDescription>All transactions for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Date</th>
                          <th className="text-left py-2 px-2">Description</th>
                          <th className="text-left py-2 px-2">Category</th>
                          <th className="text-right py-2 px-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr 
                            key={transaction.id} 
                            className={`border-b hover:bg-muted/50 ${transaction.isAnomaly ? 'bg-yellow-50' : ''}`}
                          >
                            <td className="py-2 px-2">{transaction.date}</td>
                            <td className="py-2 px-2">
                              <div className="flex items-center">
                                {transaction.description}
                                {transaction.isAnomaly && (
                                  <AlertTriangle className="h-3 w-3 ml-2 text-yellow-500" />
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-2">
                              <Badge variant="outline">{transaction.category}</Badge>
                            </td>
                            <td className="py-2 px-2 text-right font-medium">
                              {formatCurrency(transaction.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No transactions found matching your filters.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Budget Analysis Tab */}
          <TabsContent value="budget-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget vs. Actual Comparison</CardTitle>
                <CardDescription>How your spending compares to your budget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetVsActualData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{item.category}</div>
                        <div className="text-sm">
                          <span className="font-medium">{formatCurrency(item.actual)}</span>
                          <span className="text-muted-foreground"> of </span>
                          <span className="font-medium">{formatCurrency(item.budgeted)}</span>
                        </div>
                      </div>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <div 
                            style={{ 
                              width: `${Math.min(100, (item.actual / item.budgeted) * 100)}%`,
                              backgroundColor: item.actual > item.budgeted ? 'rgb(239, 68, 68)' : 'rgb(34, 197, 94)'
                            }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center rounded"
                          />
                        </div>
                      </div>
                      <div className="text-xs flex justify-between">
                        <span className={item.variance > 0 ? 'text-red-500' : item.variance < 0 ? 'text-green-500' : 'text-gray-500'}>
                          {item.variance > 0 ? `Over by ${formatCurrency(item.variance)}` : 
                           item.variance < 0 ? `Under by ${formatCurrency(Math.abs(item.variance))}` :
                           'On budget'}
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round((item.actual / item.budgeted) * 100)}% of budget
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Summary</CardTitle>
                  <CardDescription>Overall budget performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Budgeted</span>
                      <span className="font-bold">
                        {formatCurrency(budgetVsActualData.reduce((sum, item) => sum + item.budgeted, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Actual</span>
                      <span className="font-bold">
                        {formatCurrency(budgetVsActualData.reduce((sum, item) => sum + item.actual, 0))}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Net Difference</span>
                      <span className={`font-bold ${
                        budgetVsActualData.reduce((sum, item) => sum + item.variance, 0) > 0 
                          ? 'text-red-500' 
                          : 'text-green-500'
                      }`}>
                        {formatCurrency(Math.abs(budgetVsActualData.reduce((sum, item) => sum + item.variance, 0)))}
                        {budgetVsActualData.reduce((sum, item) => sum + item.variance, 0) > 0 ? ' Over' : ' Under'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Budget Recommendations</CardTitle>
                  <CardDescription>Suggestions to improve your budget</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {budgetVsActualData
                      .filter(item => item.variance > 0)
                      .sort((a, b) => b.variance - a.variance)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                          <div className="font-medium">{item.category}</div>
                          <div className="text-sm text-muted-foreground">
                            Consistently over budget by {formatCurrency(item.variance)}. Consider increasing your budget or finding ways to reduce spending in this category.
                          </div>
                        </div>
                      ))}
                    {budgetVsActualData.filter(item => item.variance > 0).length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        Great job! You're staying within budget across all categories.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Custom Report Tab */}
          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Report Builder</CardTitle>
                <CardDescription>Create a personalized financial report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="report-title">Report Title</Label>
                      <Input 
                        id="report-title" 
                        value={customReportSettings.title}
                        onChange={(e) => setCustomReportSettings({
                          ...customReportSettings,
                          title: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="report-description">Description</Label>
                      <Input 
                        id="report-description" 
                        value={customReportSettings.description}
                        onChange={(e) => setCustomReportSettings({
                          ...customReportSettings,
                          description: e.target.value
                        })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Included Sections</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-summary" 
                          checked={customReportSettings.includeSections.summary}
                          onCheckedChange={(checked) => setCustomReportSettings({
                            ...customReportSettings,
                            includeSections: {
                              ...customReportSettings.includeSections,
                              summary: checked === true
                            }
                          })}
                        />
                        <Label htmlFor="include-summary">Financial Summary</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-income-expenses" 
                          checked={customReportSettings.includeSections.incomeVsExpenses}
                          onCheckedChange={(checked) => setCustomReportSettings({
                            ...customReportSettings,
                            includeSections: {
                              ...customReportSettings.includeSections,
                              incomeVsExpenses: checked === true
                            }
                          })}
                        />
                        <Label htmlFor="include-income-expenses">Income vs Expenses</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-categories" 
                          checked={customReportSettings.includeSections.categoryBreakdown}
                          onCheckedChange={(checked) => setCustomReportSettings({
                            ...customReportSettings,
                            includeSections: {
                              ...customReportSettings.includeSections,
                              categoryBreakdown: checked === true
                            }
                          })}
                        />
                        <Label htmlFor="include-categories">Category Breakdown</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-trends" 
                          checked={customReportSettings.includeSections.spendingTrends}
                          onCheckedChange={(checked) => setCustomReportSettings({
                            ...customReportSettings,
                            includeSections: {
                              ...customReportSettings.includeSections,
                              spendingTrends: checked === true
                            }
                          })}
                        />
                        <Label htmlFor="include-trends">Spending Trends</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-transactions" 
                          checked={customReportSettings.includeSections.transactions}
                          onCheckedChange={(checked) => setCustomReportSettings({
                            ...customReportSettings,
                            includeSections: {
                              ...customReportSettings.includeSections,
                              transactions: checked === true
                            }
                          })}
                        />
                        <Label htmlFor="include-transactions">Transaction List</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="include-budget" 
                          checked={customReportSettings.includeSections.budgetComparison}
                          onCheckedChange={(checked) => setCustomReportSettings({
                            ...customReportSettings,
                            includeSections: {
                              ...customReportSettings.includeSections,
                              budgetComparison: checked === true
                            }
                          })}
                        />
                        <Label htmlFor="include-budget">Budget Analysis</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCustomReportSettings({
                      title: "My Custom Report",
                      description: "Personal financial analysis",
                      includeSections: {
                        summary: true,
                        incomeVsExpenses: true,
                        categoryBreakdown: true,
                        spendingTrends: true,
                        transactions: false,
                        budgetComparison: true
                      },
                      filters: {
                        categories: [],
                        excludeCategories: [],
                        minAmount: null,
                        maxAmount: null
                      }
                    })}>
                      Reset
                    </Button>
                    <Button>
                      <Save className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Preview of the custom report would go here */}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
