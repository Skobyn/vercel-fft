"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Edit, AlertTriangle, PieChart, BarChart, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAuth } from '@/providers/firebase-auth-provider';
import { useBudgets, useExpenses } from '@/hooks/use-financial-data';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import { BudgetVisualization } from "@/components/visualizations/budget-visualizations";
import { startOfMonth, endOfMonth } from "date-fns";

type BudgetCategory = {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  icon?: string;
  color?: string;
  category?: string;
  frequency: string;
};

export default function BudgetsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { budgets, loading: budgetsLoading, addBudget, updateBudget, deleteBudget } = useBudgets();
  const { expenses, loading: expensesLoading } = useExpenses();
  
  const [openNewBudgetDialog, setOpenNewBudgetDialog] = useState(false);
  const [budgetName, setBudgetName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "chart">("cards");
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [displayFrequency, setDisplayFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [budgetFrequency, setBudgetFrequency] = useState<"once" | "daily" | "weekly" | "biweekly" | "monthly">("monthly");
  const [visualizationType, setVisualizationType] = useState<'bucket' | 'envelope' | 'gauge' | 'fill'>('fill');

  // Sample predefined categories
  const predefinedCategories = [
    { value: "housing", label: "Housing", icon: "🏠", color: "bg-blue-500" },
    { value: "transportation", label: "Transportation", icon: "🚗", color: "bg-yellow-500" },
    { value: "food", label: "Food & Dining", icon: "🍔", color: "bg-green-500" },
    { value: "utilities", label: "Utilities", icon: "💡", color: "bg-purple-500" },
    { value: "healthcare", label: "Healthcare", icon: "🏥", color: "bg-indigo-500" },
    { value: "personal", label: "Personal", icon: "👤", color: "bg-orange-500" },
    { value: "entertainment", label: "Entertainment", icon: "🎬", color: "bg-red-500" },
    { value: "savings", label: "Savings", icon: "💰", color: "bg-emerald-500" },
    { value: "debt", label: "Debt Payments", icon: "💳", color: "bg-teal-500" },
    { value: "education", label: "Education", icon: "📚", color: "bg-cyan-500" },
    { value: "shopping", label: "Shopping", icon: "🛍️", color: "bg-pink-500" },
    { value: "travel", label: "Travel", icon: "✈️", color: "bg-violet-500" },
  ];

  // Use real data if available, otherwise default to empty array
  const budgetCategories: BudgetCategory[] = budgets && budgets.length > 0 
    ? budgets.map(budget => ({
        id: budget.id,
        name: budget.name,
        budgeted: budget.amount || 0,
        spent: budget.spent || 0,
        icon: budget.icon || getCategoryIcon(budget.category),
        color: budget.color || getCategoryColor(budget.category),
        category: budget.category,
        frequency: budget.frequency || "monthly"
      }))
    : [];

  // Helper function to adjust budget amount based on display frequency
  const adjustAmountForFrequency = (amount: number, budgetFreq: string = "monthly"): number => {
    // Convert all values to daily first
    let dailyAmount: number;
    
    switch (budgetFreq) {
      case "daily":
        dailyAmount = amount;
        break;
      case "weekly":
        dailyAmount = amount / 7;
        break;
      case "biweekly":
        dailyAmount = amount / 14;
        break;
      case "monthly":
      default:
        dailyAmount = amount / 30; // Using 30 days as average month length
        break;
    }
    
    // Now convert daily amount to the selected display frequency
    switch (displayFrequency) {
      case "daily":
        return dailyAmount;
      case "weekly":
        return dailyAmount * 7;
      case "monthly":
      default:
        return dailyAmount * 30;
    }
  };

  // Helper to get icon for category
  function getCategoryIcon(categoryValue: string): string {
    const category = predefinedCategories.find(c => c.value === categoryValue);
    return category ? category.icon : "📊";
  }

  // Helper to get color for category
  function getCategoryColor(categoryValue: string): string {
    const category = predefinedCategories.find(c => c.value === categoryValue);
    return category ? category.color : "bg-gray-500";
  }

  // Filter budget categories based on search
  const filteredBudgetCategories = budgetCategories.filter(category =>
    searchText === "" || category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Calculate total budgeted and spent
  const totalBudgeted = budgetCategories.reduce((sum, category) => 
    sum + adjustAmountForFrequency(category.budgeted, category.frequency), 0);
  
  const totalSpent = budgetCategories.reduce((sum, category) => 
    sum + adjustAmountForFrequency(category.spent || 0, category.frequency), 0);

  // Check if this is the first time viewing budgets
  useEffect(() => {
    if (budgets && !budgetsLoading) {
      // Show setup guide if no budgets exist
      setShowSetupGuide(budgets.length === 0);
    }
  }, [budgets, budgetsLoading]);

  // Function to handle adding a new budget
  const handleAddBudget = async () => {
    // Validate inputs
    if (!budgetName) {
      toast.error("Please enter a budget name");
      return;
    }

    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }

    if (!budgetCategory) {
      toast.error("Please select a category");
      return;
    }

    try {
      const categoryInfo = predefinedCategories.find(c => c.value === budgetCategory);
      
      // Create the budget object
      const newBudget = {
        name: budgetName,
        amount: parseFloat(budgetAmount),
        spent: 0,
        category: budgetCategory,
        icon: categoryInfo?.icon || "📊",
        color: categoryInfo?.color || "bg-gray-500",
        month: selectedMonth,
        frequency: budgetFrequency,
        createdAt: new Date().toISOString()
      };

      await addBudget(newBudget);
      
      // Reset form
      setBudgetName("");
      setBudgetAmount("");
      setBudgetCategory("");
      setBudgetFrequency("monthly");

      // Close dialog
      setOpenNewBudgetDialog(false);
      
      // Hide setup guide if it was showing
      setShowSetupGuide(false);
    } catch (error) {
      console.error("Error adding budget:", error);
      toast.error("Failed to add budget");
    }
  };

  // Function to determine status based on spending
  const getStatusColor = (budgeted: number, spent: number) => {
    if (!spent) return "bg-green-500"; // No spending yet
    
    const percentSpent = (spent / budgeted) * 100;
    if (percentSpent < 80) return "bg-green-500";
    if (percentSpent < 100) return "bg-amber-500";
    return "bg-red-500";
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    }
  }, [authLoading, user, router]);

  if (authLoading || budgetsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  // Calculate spending for each budget
  const budgetSpending = budgets.map(budget => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const spent = expenses
      .filter(expense => 
        expense.category === budget.category &&
        new Date(expense.date) >= start &&
        new Date(expense.date) <= end
      )
      .reduce((sum, expense) => sum + expense.amount, 0);

    return {
      ...budget,
      spent
    };
  });

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground">
              Set and track budgets for every category
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={displayFrequency} onValueChange={(value: "daily" | "weekly" | "monthly") => setDisplayFrequency(value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={openNewBudgetDialog} onOpenChange={setOpenNewBudgetDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Budget</DialogTitle>
                  <DialogDescription>
                    Set a budget for a specific category to track your spending.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="budget-name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="budget-name"
                      value={budgetName}
                      onChange={(e) => setBudgetName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="budget-amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="budget-amount"
                      type="number"
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="budget-frequency" className="text-right">
                      Frequency
                    </Label>
                    <Select 
                      value={budgetFrequency} 
                      onValueChange={(value: "once" | "daily" | "weekly" | "biweekly" | "monthly") => setBudgetFrequency(value)}
                    >
                      <SelectTrigger id="budget-frequency" className="col-span-3">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="once">One-Time</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="budget-category" className="text-right">
                      Category
                    </Label>
                    <Select
                      value={budgetCategory}
                      onValueChange={setBudgetCategory}
                    >
                      <SelectTrigger id="budget-category" className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center">
                              <span className="mr-2">{category.icon}</span>
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddBudget}>
                    Create Budget
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Budget Setup Guide */}
        {showSetupGuide && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Budget Setup Guide</CardTitle>
                  <CardDescription className="text-blue-700">
                    Start by creating your first budget category
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <h3 className="font-medium text-blue-800">Why set a budget?</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Budgets help you plan your spending, save more, and reach your financial goals faster.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-blue-200 bg-blue-100/50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-1">Step 1</h4>
                    <p className="text-sm text-blue-700">Create budget categories that match your spending habits</p>
                  </div>
                  <div className="border border-blue-200 bg-blue-100/50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-1">Step 2</h4>
                    <p className="text-sm text-blue-700">Set realistic monthly limits for each category</p>
                  </div>
                  <div className="border border-blue-200 bg-blue-100/50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-1">Step 3</h4>
                    <p className="text-sm text-blue-700">Add your expenses to track your spending against your budget</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setOpenNewBudgetDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Budget
              </Button>
              <Button variant="ghost" className="ml-2" onClick={() => setShowSetupGuide(false)}>
                Dismiss
              </Button>
            </CardFooter>
          </Card>
        )}

        {budgetCategories.length > 0 && (
          <>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  className="pl-8"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2023-01">January 2023</SelectItem>
                  <SelectItem value="2023-02">February 2023</SelectItem>
                  <SelectItem value="2023-03">March 2023</SelectItem>
                  <SelectItem value="2023-04">April 2023</SelectItem>
                  <SelectItem value="2023-05">May 2023</SelectItem>
                  <SelectItem value="2023-06">June 2023</SelectItem>
                  <SelectItem value="2023-07">July 2023</SelectItem>
                  <SelectItem value="2023-08">August 2023</SelectItem>
                  <SelectItem value="2023-09">September 2023</SelectItem>
                  <SelectItem value="2023-10">October 2023</SelectItem>
                  <SelectItem value="2023-11">November 2023</SelectItem>
                  <SelectItem value="2023-12">December 2023</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1 rounded-md border p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    viewMode === "cards" && "bg-muted text-foreground"
                  )}
                  onClick={() => setViewMode("cards")}
                >
                  <BarChart className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    viewMode === "chart" && "bg-muted text-foreground"
                  )}
                  onClick={() => setViewMode("chart")}
                >
                  <PieChart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Total Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalBudgeted.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Total Spent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Remaining</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${(totalBudgeted - totalSpent).toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Budget Overview</CardTitle>
                    <CardDescription>
                      Choose how you want to visualize your budgets
                    </CardDescription>
                  </div>
                  <Tabs 
                    value={visualizationType} 
                    onValueChange={(value) => setVisualizationType(value as any)}
                    className="w-[400px]"
                  >
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="fill">Basic</TabsTrigger>
                      <TabsTrigger value="bucket">Bucket</TabsTrigger>
                      <TabsTrigger value="envelope">Envelope</TabsTrigger>
                      <TabsTrigger value="gauge">Gauge</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {budgetSpending.map(budget => (
                    <BudgetVisualization
                      key={budget.id}
                      name={budget.name}
                      spent={budget.spent}
                      budget={budget.amount}
                      type={visualizationType}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {filteredBudgetCategories.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No results found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredBudgetCategories.map((category) => {
                  const adjustedBudget = adjustAmountForFrequency(category.budgeted, category.frequency);
                  const adjustedSpent = adjustAmountForFrequency(category.spent, category.frequency);
                  const percentSpent = adjustedBudget > 0 ? (adjustedSpent / adjustedBudget) * 100 : 0;
                  
                  return (
                    <Card key={category.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-lg">
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${category.color}`}></span>
                          {predefinedCategories.find(c => c.value === category.category)?.label || category.category}
                          <span className="text-xs">({category.frequency})</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Budget ({displayFrequency})</span>
                          <span className="font-medium">${adjustedBudget.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Spent ({displayFrequency})</span>
                          <span className="font-medium">${adjustedSpent.toFixed(2)}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${getStatusColor(adjustedBudget, adjustedSpent)}`}
                            style={{ width: `${Math.min(100, percentSpent)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {Math.min(100, percentSpent).toFixed(0)}% spent
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ${(adjustedBudget - adjustedSpent).toFixed(2)} remaining
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
