"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleDollarSign, ArrowUp, ArrowDown, CreditCard, AlertCircle, Plus, PiggyBank } from "lucide-react";
import Link from "next/link";
import { DashboardCustomize } from "./customize";
import { FinancialInsights } from "@/components/ai/financial-insights";
import { useAuth } from '@/providers/firebase-auth-provider';
import { toast } from "sonner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const authCheckRef = useRef(false);

  // Simplified auth check with anti-refresh-loop protection
  useEffect(() => {
    // Skip if we've already checked
    if (authCheckRef.current) return;
    
    // Don't do anything while still loading
    if (loading) return;
    
    console.log("Dashboard auth check - User:", user ? `authenticated: ${user.email}` : "not authenticated", "Loading:", loading);
    
    // Check if we're in a refresh loop
    const refreshCount = parseInt(sessionStorage.getItem('dashboard_refresh_count') || '0');
    const lastRefresh = parseInt(sessionStorage.getItem('dashboard_last_refresh') || '0');
    const now = Date.now();
    
    // If we're refreshing too quickly (multiple times within 3 seconds)
    if (refreshCount > 3 && now - lastRefresh < 3000) {
      console.warn("Detected potential refresh loop, showing dashboard anyway");
      sessionStorage.setItem('refresh_loop_detected', 'true');
      setIsLoading(false);
      return;
    }
    
    // Update refresh tracking
    sessionStorage.setItem('dashboard_refresh_count', (refreshCount + 1).toString());
    sessionStorage.setItem('dashboard_last_refresh', now.toString());
    
    // Mark that we've checked auth
    authCheckRef.current = true;
    
    // Check for cached user in localStorage as fallback
    if (!user) {
      try {
        const cachedUser = localStorage.getItem('authUser');
        if (cachedUser) {
          console.log("Using cached user from localStorage");
          setIsLoading(false);
          return;
        }
        
        // No user found - redirect to signin unless we've detected a refresh loop
        if (sessionStorage.getItem('refresh_loop_detected') !== 'true') {
          console.log("No authenticated user found, redirecting to signin");
          // Clear refresh tracking before redirecting
          sessionStorage.removeItem('dashboard_refresh_count');
          sessionStorage.removeItem('dashboard_last_refresh');
          router.push("/auth/signin");
        } else {
          console.log("Refresh loop detected, showing dashboard without user");
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error checking localStorage:", e);
        setIsLoading(false);
      }
    } else {
      // User is authenticated, show dashboard
      console.log("User is authenticated, showing dashboard");
      setIsLoading(false);
    }
  }, [user, loading, router]);

  // Clear refresh loop detection when component is mounted
  useEffect(() => {
    // Reset refresh detection if it's been more than 10 seconds since last visit
    const lastVisit = parseInt(sessionStorage.getItem('dashboard_last_visit') || '0');
    const now = Date.now();
    
    if (now - lastVisit > 10000) {
      sessionStorage.removeItem('refresh_loop_detected');
      sessionStorage.removeItem('dashboard_refresh_count');
    }
    
    sessionStorage.setItem('dashboard_last_visit', now.toString());
    
    return () => {
      // If we've successfully stayed on the dashboard for 5 seconds, clear the refresh detection
      const timeoutId = setTimeout(() => {
        sessionStorage.removeItem('refresh_loop_detected');
        sessionStorage.removeItem('dashboard_refresh_count');
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    };
  }, []);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // User should be authenticated if we got this far, but handle the case when they aren't
  if (!user && sessionStorage.getItem('refresh_loop_detected') !== 'true') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-500 mb-4">
            You need to be signed in to view this page. Please sign in to continue.
          </p>
          <Button onClick={() => router.push('/auth/signin')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

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
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href="/transactions">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
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
                          <p className="text-xs text-muted-foreground">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">${bill.amount.toFixed(2)}</span>
                          {new Date(bill.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link href="/bills">
                      <Button variant="outline" size="sm">View All</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Savings Goals</CardTitle>
                  <Link href="/goals/new">
                    <Button variant="ghost" size="icon">
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Add Goal</span>
                    </Button>
                  </Link>
                </div>
                <CardDescription>Track your progress towards financial goals.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {savingsGoals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{goal.name}</p>
                          <p className="text-xs text-muted-foreground">Target: ${goal.target.toFixed(2)} by {new Date(goal.deadline).toLocaleDateString()}</p>
                        </div>
                        <p className="text-sm font-semibold">${goal.current.toFixed(2)} / ${goal.target.toFixed(2)}</p>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min(100, (goal.current / goal.target) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-right text-muted-foreground">{Math.round((goal.current / goal.target) * 100)}% complete</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <Link href="/goals">
                    <Button variant="outline" size="sm">Manage Goals</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <FinancialInsights />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Transaction List</CardTitle>
                <CardDescription>
                  View and filter your recent transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    Transaction list would be displayed here.
                    <Link href="/transactions" className="underline ml-1">
                      View full transactions page
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bills Overview</CardTitle>
                <CardDescription>
                  Manage your upcoming and recurring bills
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    Bills management would be displayed here.
                    <Link href="/bills" className="underline ml-1">
                      View full bills page
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Goals</CardTitle>
                <CardDescription>
                  Track progress towards your savings goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    Savings goals would be displayed here.
                    <Link href="/goals" className="underline ml-1">
                      View full goals page
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
