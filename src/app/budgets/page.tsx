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
import { Search, Plus, Edit, AlertTriangle, PieChart, BarChart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type BudgetCategory = {
  id: number;
  name: string;
  budgeted: number;
  spent: number;
  icon: string;
  color: string;
};

export default function BudgetsPage() {
  const [openNewBudgetDialog, setOpenNewBudgetDialog] = useState(false);
  const [budgetName, setBudgetName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "chart">("cards");

  // Sample predefined categories
  const predefinedCategories = [
    { value: "housing", label: "Housing" },
    { value: "transportation", label: "Transportation" },
    { value: "food", label: "Food & Dining" },
    { value: "utilities", label: "Utilities" },
    { value: "healthcare", label: "Healthcare" },
    { value: "personal", label: "Personal" },
    { value: "entertainment", label: "Entertainment" },
    { value: "savings", label: "Savings" },
    { value: "debt", label: "Debt Payments" },
    { value: "education", label: "Education" },
    { value: "shopping", label: "Shopping" },
    { value: "travel", label: "Travel" },
  ];

  // Sample budget data
  const budgetCategories: BudgetCategory[] = [
    {
      id: 1,
      name: "Housing",
      budgeted: 1500,
      spent: 1450,
      icon: "🏠",
      color: "bg-blue-500",
    },
    {
      id: 2,
      name: "Food & Dining",
      budgeted: 500,
      spent: 420,
      icon: "🍔",
      color: "bg-green-500",
    },
    {
      id: 3,
      name: "Transportation",
      budgeted: 300,
      spent: 275,
      icon: "🚗",
      color: "bg-yellow-500",
    },
    {
      id: 4,
      name: "Utilities",
      budgeted: 250,
      spent: 230,
      icon: "💡",
      color: "bg-purple-500",
    },
    {
      id: 5,
      name: "Entertainment",
      budgeted: 200,
      spent: 250,
      icon: "🎬",
      color: "bg-red-500",
    },
    {
      id: 6,
      name: "Healthcare",
      budgeted: 300,
      spent: 150,
      icon: "🏥",
      color: "bg-indigo-500",
    },
    {
      id: 7,
      name: "Shopping",
      budgeted: 150,
      spent: 180,
      icon: "🛍️",
      color: "bg-pink-500",
    },
    {
      id: 8,
      name: "Savings",
      budgeted: 500,
      spent: 500,
      icon: "💰",
      color: "bg-emerald-500",
    },
  ];

  // Filter budget categories based on search
  const filteredBudgetCategories = budgetCategories.filter(category =>
    searchText === "" || category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Calculate total budgeted and spent
  const totalBudgeted = budgetCategories.reduce((sum, category) => sum + category.budgeted, 0);
  const totalSpent = budgetCategories.reduce((sum, category) => sum + category.spent, 0);

  // Function to handle adding a new budget
  const handleAddBudget = () => {
    // In a real app, this would add the budget to the database
    console.log("Adding new budget category:", {
      name: budgetName,
      amount: parseFloat(budgetAmount),
      category: budgetCategory,
    });

    // Reset form
    setBudgetName("");
    setBudgetAmount("");
    setBudgetCategory("");

    // Close dialog
    setOpenNewBudgetDialog(false);
  };

  // Function to determine status based on spending
  const getStatusColor = (budgeted: number, spent: number) => {
    const percentSpent = (spent / budgeted) * 100;
    if (percentSpent < 80) return "bg-green-500";
    if (percentSpent < 100) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground">
              Set and track budgets for every category
            </p>
          </div>
          <Dialog open={openNewBudgetDialog} onOpenChange={setOpenNewBudgetDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Budget Category</DialogTitle>
                <DialogDescription>
                  Create a new budget category to track your spending.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="budgetName">Category Name</Label>
                  <Input
                    id="budgetName"
                    value={budgetName}
                    onChange={(e) => setBudgetName(e.target.value)}
                    placeholder="e.g. Groceries"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Monthly Budget</Label>
                  <Input
                    id="amount"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Parent Category</Label>
                  <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select Parent Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenNewBudgetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddBudget}>
                  Add Budget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-01">January 2025</SelectItem>
                <SelectItem value="2025-02">February 2025</SelectItem>
                <SelectItem value="2025-03">March 2025</SelectItem>
                <SelectItem value="2025-04">April 2025</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("cards")}
              >
                Cards
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                className="rounded-none"
                onClick={() => setViewMode("table")}
              >
                Table
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant={viewMode === "chart" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("chart")}
              >
                Chart
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
            <CardDescription>
              {new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Total Budgeted</p>
                  <p className="text-2xl font-bold">${totalBudgeted.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Spent</p>
                  <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Remaining</p>
                  <p className={`text-2xl font-bold ${(totalBudgeted - totalSpent) < 0 ? "text-red-500" : ""}`}>
                    ${(totalBudgeted - totalSpent).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Spent of Budget</p>
                  <p className="text-2xl font-bold">
                    {Math.min(Math.round((totalSpent / totalBudgeted) * 100), 100)}%
                  </p>
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full ${totalSpent > totalBudgeted ? "bg-red-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(Math.round((totalSpent / totalBudgeted) * 100), 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === "cards" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBudgetCategories.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${category.color} text-white`}>
                        {category.icon}
                      </div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <CardDescription>
                      {Math.round((category.spent / category.budgeted) * 100)}% of budget
                    </CardDescription>
                    {category.spent > category.budgeted && (
                      <Badge variant="destructive" className="text-xs">Over Budget</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Spent: <span className="font-bold">${category.spent.toFixed(2)}</span></span>
                      <span className="text-sm">Budget: <span className="font-bold">${category.budgeted.toFixed(2)}</span></span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getStatusColor(category.budgeted, category.spent)}`}
                        style={{ width: `${Math.min(Math.round((category.spent / category.budgeted) * 100), 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Remaining: ${(category.budgeted - category.spent).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {viewMode === "table" && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Category</th>
                      <th className="text-right p-4">Budgeted</th>
                      <th className="text-right p-4">Spent</th>
                      <th className="text-right p-4">Remaining</th>
                      <th className="text-center p-4">Progress</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgetCategories.map((category) => (
                      <tr key={category.id} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${category.color} text-white text-xs`}>
                              {category.icon}
                            </div>
                            {category.name}
                          </div>
                        </td>
                        <td className="text-right p-4">${category.budgeted.toFixed(2)}</td>
                        <td className="text-right p-4">${category.spent.toFixed(2)}</td>
                        <td className={`text-right p-4 ${(category.budgeted - category.spent) < 0 ? "text-red-500" : ""}`}>
                          ${(category.budgeted - category.spent).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getStatusColor(category.budgeted, category.spent)}`}
                              style={{ width: `${Math.min(Math.round((category.spent / category.budgeted) * 100), 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="text-right p-4">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {viewMode === "chart" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Budget Distribution</CardTitle>
                <CardDescription>How your budget is allocated across categories</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-64 w-64 flex items-center justify-center border rounded-full relative">
                  <PieChart className="h-10 w-10 text-muted-foreground" />
                  <p className="text-center text-sm mt-2">Pie chart representation would be shown here</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Budget vs. Actual</CardTitle>
                <CardDescription>Comparison of budgeted vs. actual spending</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-64 w-full flex items-center justify-center border rounded">
                  <BarChart className="h-10 w-10 text-muted-foreground" />
                  <p className="text-center text-sm mt-2">Bar chart comparison would be shown here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
