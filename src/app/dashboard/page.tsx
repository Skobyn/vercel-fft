"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleDollarSign, ArrowUp, ArrowDown, PiggyBank, Edit2, Check } from "lucide-react";
import Link from "next/link";
import { DashboardCustomize } from "./customize";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function DashboardPage() {
  // Debug log to see when the component renders
  console.log("Dashboard component rendering");
  
  useEffect(() => {
    console.log("Dashboard component mounted");
    // Debug toast to confirm component has successfully mounted
    toast.success("Dashboard loaded successfully");
  }, []);

  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  
  // Financial data with state for demo mode editing
  const [summaryData, setSummaryData] = useState({
    balance: 5250.75,
    income: 4500.00,
    expenses: 3250.25,
    savings: 1249.75,
  });
  
  // Track which values are being edited
  const [editing, setEditing] = useState({
    balance: false,
    income: false,
    expenses: false,
    savings: false,
  });
  
  // Temporary values for editing
  const [tempValues, setTempValues] = useState({
    balance: "5250.75",
    income: "4500.00",
    expenses: "3250.25",
    savings: "1249.75",
  });

  // Bills data
  const [upcomingBills, setUpcomingBills] = useState([
    {
      id: 1,
      name: "Mortgage",
      amount: 1200.00,
      dueDate: "2025-04-01",
      isPaid: false,
    },
    {
      id: 2,
      name: "Electricity",
      amount: 85.50,
      dueDate: "2025-03-28",
      isPaid: false,
    },
    {
      id: 3,
      name: "Internet",
      amount: 69.99,
      dueDate: "2025-04-05",
      isPaid: false,
    },
  ]);

  // Transactions data
  const [recentTransactions, setRecentTransactions] = useState([
    {
      id: 1,
      description: "Grocery Store",
      amount: -120.45,
      date: "2025-03-22",
      category: "Food & Dining",
    },
    {
      id: 2,
      description: "Salary",
      amount: 2250.00,
      date: "2025-03-15",
      category: "Income",
    },
    {
      id: 3,
      description: "Gas Station",
      amount: -45.67,
      date: "2025-03-20",
      category: "Transportation",
    },
    {
      id: 4,
      description: "Netflix",
      amount: -15.99,
      date: "2025-03-18",
      category: "Entertainment",
    },
  ]);

  // Goals data
  const [savingsGoals, setSavingsGoals] = useState([
    {
      id: 1,
      name: "Vacation",
      target: 3000,
      current: 1500,
      deadline: "2025-08-15",
    },
    {
      id: 2,
      name: "New Car",
      target: 15000,
      current: 4500,
      deadline: "2026-01-30",
    },
  ]);
  
  // Handle editing of financial summary data
  const startEditing = (field: keyof typeof editing) => {
    setEditing({...editing, [field]: true});
    setTempValues({
      ...tempValues, 
      [field]: summaryData[field].toString()
    });
  };
  
  const saveEdit = (field: keyof typeof editing) => {
    try {
      const value = parseFloat(tempValues[field]);
      if (isNaN(value)) {
        throw new Error("Please enter a valid number");
      }
      
      // Update the data
      setSummaryData({
        ...summaryData,
        [field]: parseFloat(value.toFixed(2))
      });
      
      setEditing({...editing, [field]: false});
      toast.success(`Updated ${field} to $${value.toFixed(2)}`);
    } catch (error) {
      toast.error("Please enter a valid number");
    }
  };
  
  const cancelEdit = (field: keyof typeof editing) => {
    setEditing({...editing, [field]: false});
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Your financial overview for March 2025
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/connect-bank">
                <Button>
                  <CircleDollarSign className="mr-2 h-4 w-4" />
                  Connect Bank
                </Button>
              </Link>
              <DashboardCustomize />
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-2">
            <h3 className="font-medium">Demo Mode Active</h3>
            <p className="text-sm mt-1">
              You can edit any value by clicking the edit icon next to it.
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                    <div className="flex items-center">
                      <CircleDollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                      {!editing.balance ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => startEditing('balance')}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => saveEdit('balance')}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!editing.balance ? (
                      <div className="text-2xl font-bold">${summaryData.balance.toFixed(2)}</div>
                    ) : (
                      <Input 
                        value={tempValues.balance}
                        onChange={(e) => setTempValues({...tempValues, balance: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit('balance')}
                        onBlur={() => cancelEdit('balance')}
                        className="text-xl font-bold"
                        autoFocus
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      Across all accounts
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Income</CardTitle>
                    <div className="flex items-center">
                      <ArrowUp className="h-4 w-4 text-emerald-500 mr-2" />
                      {!editing.income ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => startEditing('income')}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => saveEdit('income')}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!editing.income ? (
                      <div className="text-2xl font-bold">${summaryData.income.toFixed(2)}</div>
                    ) : (
                      <Input 
                        value={tempValues.income}
                        onChange={(e) => setTempValues({...tempValues, income: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit('income')}
                        onBlur={() => cancelEdit('income')}
                        className="text-xl font-bold"
                        autoFocus
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                    <div className="flex items-center">
                      <ArrowDown className="h-4 w-4 text-rose-500 mr-2" />
                      {!editing.expenses ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => startEditing('expenses')}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => saveEdit('expenses')}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!editing.expenses ? (
                      <div className="text-2xl font-bold">${summaryData.expenses.toFixed(2)}</div>
                    ) : (
                      <Input 
                        value={tempValues.expenses}
                        onChange={(e) => setTempValues({...tempValues, expenses: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit('expenses')}
                        onBlur={() => cancelEdit('expenses')}
                        className="text-xl font-bold"
                        autoFocus
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Savings</CardTitle>
                    <div className="flex items-center">
                      <PiggyBank className="h-4 w-4 text-muted-foreground mr-2" />
                      {!editing.savings ? (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => startEditing('savings')}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          onClick={() => saveEdit('savings')}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!editing.savings ? (
                      <div className="text-2xl font-bold">${summaryData.savings.toFixed(2)}</div>
                    ) : (
                      <Input 
                        value={tempValues.savings}
                        onChange={(e) => setTempValues({...tempValues, savings: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && saveEdit('savings')}
                        onBlur={() => cancelEdit('savings')}
                        className="text-xl font-bold"
                        autoFocus
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your latest financial activity.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentTransactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{transaction.description}</p>
                            <p className="text-xs text-muted-foreground">{transaction.category}</p>
                          </div>
                          <div className={`text-sm font-semibold ${transaction.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/transactions">View All Transactions</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Bills</CardTitle>
                    <CardDescription>Bills due in the next 30 days.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {upcomingBills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">{bill.name}</p>
                            <p className="text-xs text-muted-foreground">Due on {new Date(bill.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-sm font-semibold">${bill.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/bills">Manage Bills</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Savings Goals</CardTitle>
                  <CardDescription>Track your progress towards financial goals.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {savingsGoals.map((goal) => (
                      <div key={goal.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <p className="text-sm font-medium">{goal.name}</p>
                            <p className="text-xs text-muted-foreground">Target: ${goal.target.toFixed(2)}</p>
                          </div>
                          <p className="text-sm font-medium">${goal.current.toFixed(2)} / ${goal.target.toFixed(2)}</p>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${(goal.current / goal.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full mt-4" asChild>
                      <Link href="/goals">View All Goals</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transactions</CardTitle>
                  <CardDescription>Your recent financial activity.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Detailed transaction view coming soon.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/transactions">Go to Transactions</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bills" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bills</CardTitle>
                  <CardDescription>Your upcoming and recent bills.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Detailed bills view coming soon.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/bills">Go to Bills</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="goals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Goals</CardTitle>
                  <CardDescription>Your financial goals and progress.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Detailed goals view coming soon.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/goals">Go to Goals</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
