"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/providers/firebase-auth-provider";
import { useIncomes } from "@/hooks/use-financial-data";
import { IncomeList } from "@/components/dashboard/income-list";
import { AddIncomeDialog } from "@/components/forms/add-income-dialog";
import { MainLayout } from "@/components/layout/main-layout";
import { Income } from "@/types/financial";

export default function IncomePage() {
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { incomes, loading: incomesLoading, addIncome, updateIncome, deleteIncome } = useIncomes();

  // Check auth
  useEffect(() => {
    if (!user && !incomesLoading) {
      router.push("/auth/signin");
    } else {
      setLoading(false);
    }
  }, [user, router, incomesLoading]);

  if (loading || incomesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Income</h1>
          <Button onClick={() => setAddDialogOpen(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Income
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Income</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <IncomeList 
              incomes={incomes}
              onEdit={updateIncome} 
              onDelete={deleteIncome}
            />
          </TabsContent>

          <TabsContent value="upcoming">
            <IncomeList 
              incomes={(() => {
                const today = new Date();
                const nextMonth = new Date();
                nextMonth.setDate(today.getDate() + 30);
                
                // Array to store all occurrences
                const occurrences: Income[] = [];
                
                // Process each income
                incomes.forEach(income => {
                  // If it's a one-time income and falls within the next 30 days, add it
                  if (!income.isRecurring) {
                    const incomeDate = new Date(income.date);
                    if (incomeDate >= today && incomeDate <= nextMonth) {
                      occurrences.push({...income});
                    }
                    return;
                  }
                  
                  // For recurring income, generate all instances within the next 30 days
                  const { frequency } = income;
                  let currentDate = new Date(income.date);
                  
                  // If the date is in the past, calculate the next occurrence
                  if (currentDate < today) {
                    const daysElapsed = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    if (frequency === 'daily') {
                      // Just use today
                      currentDate = new Date(today);
                    } else if (frequency === 'weekly') {
                      const weeksElapsed = Math.ceil(daysElapsed / 7);
                      const daysToAdd = weeksElapsed * 7;
                      currentDate = new Date(currentDate);
                      currentDate.setDate(currentDate.getDate() + daysToAdd);
                    } else if (frequency === 'biweekly') {
                      const biweeksElapsed = Math.ceil(daysElapsed / 14);
                      const daysToAdd = biweeksElapsed * 14;
                      currentDate = new Date(currentDate);
                      currentDate.setDate(currentDate.getDate() + daysToAdd);
                    } else if (frequency === 'monthly') {
                      const monthsElapsed = Math.ceil(daysElapsed / 30);
                      currentDate = new Date(currentDate);
                      currentDate.setMonth(currentDate.getMonth() + monthsElapsed);
                    } else if (frequency === 'quarterly') {
                      const quartersElapsed = Math.ceil(daysElapsed / 90);
                      currentDate = new Date(currentDate);
                      currentDate.setMonth(currentDate.getMonth() + (quartersElapsed * 3));
                    } else if (frequency === 'annually') {
                      const yearsElapsed = Math.ceil(daysElapsed / 365);
                      currentDate = new Date(currentDate);
                      currentDate.setFullYear(currentDate.getFullYear() + yearsElapsed);
                    }
                  }
                  
                  // Generate occurrences for the next 30 days
                  while (currentDate <= nextMonth) {
                    if (currentDate >= today) {
                      const occurrence = {
                        ...income,
                        id: `${income.id}-${currentDate.getTime()}`,
                        date: currentDate.toISOString(),
                        originalId: income.id, // Keep track of the original ID
                      };
                      occurrences.push(occurrence);
                    }
                    
                    // Create a new date object for each iteration to avoid modifying the same reference
                    const nextDate = new Date(currentDate);
                    
                    // Calculate next occurrence based on frequency
                    if (frequency === 'daily') {
                      nextDate.setDate(nextDate.getDate() + 1);
                    } else if (frequency === 'weekly') {
                      nextDate.setDate(nextDate.getDate() + 7);
                    } else if (frequency === 'biweekly') {
                      nextDate.setDate(nextDate.getDate() + 14);
                    } else if (frequency === 'monthly') {
                      nextDate.setMonth(nextDate.getMonth() + 1);
                    } else if (frequency === 'quarterly') {
                      nextDate.setMonth(nextDate.getMonth() + 3);
                    } else if (frequency === 'annually') {
                      nextDate.setFullYear(nextDate.getFullYear() + 1);
                    } else {
                      // Skip if it's not a recognized frequency
                      break;
                    }
                    
                    currentDate = nextDate;
                  }
                });
                
                // Sort by date
                return occurrences.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              })()}
              onEdit={updateIncome} 
              onDelete={deleteIncome}
            />
          </TabsContent>

          <TabsContent value="recurring">
            <IncomeList 
              incomes={incomes.filter(income => 
                income.isRecurring
              )} 
              onEdit={updateIncome} 
              onDelete={deleteIncome}
            />
          </TabsContent>
        </Tabs>

        <AddIncomeDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen}
          onAddIncome={addIncome}
        />
      </div>
    </MainLayout>
  );
} 