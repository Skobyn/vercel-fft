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
      <div className="container py-10">
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
              incomes={incomes.filter(income => 
                new Date(income.date) > new Date() && 
                !income.isRecurring
              )} 
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