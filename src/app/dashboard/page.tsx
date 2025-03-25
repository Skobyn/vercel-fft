"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleDollarSign, ArrowUp, ArrowDown, PiggyBank } from "lucide-react";
import Link from "next/link";
import { DashboardCustomize } from "./customize";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardPage() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");

  // Mock data - in a real app, this would come from an API
  const summaryData = {
    balance: 5250.75,
    income: 4500.00,
    expenses: 3250.25,
    savings: 1249.75,
  };

  const upcomingBills = [
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
  ];

  const recentTransactions = [
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
  ];

  const savingsGoals = [
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
  ];

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
                    <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${summaryData.balance.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all accounts
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Income</CardTitle>
                    <ArrowUp className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${summaryData.income.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                    <ArrowDown className="h-4 w-4 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${summaryData.expenses.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      This month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Savings</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${summaryData.savings.toFixed(2)}</div>
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
