"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { IncomeList } from "@/components/dashboard/income-list";
import { BillsList } from "@/components/dashboard/bills-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function DashboardPage() {
  const { user, loading, demoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <LoadingSpinner size="xl" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null; // This will redirect due to the useEffect above
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-6">Financial Dashboard</h1>
        
        {demoMode && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h2 className="font-semibold text-amber-800 mb-2">Demo Mode Active</h2>
            <p className="text-amber-700 mb-3">
              You&apos;re currently using the demo mode. Your data won&apos;t be saved
              between sessions.
            </p>
            <Button
              variant="outline"
              className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => router.push("/auth/signup")}
            >
              Create an Account
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <BalanceCard />
          <CashFlowChart />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <IncomeList />
          <BillsList />
        </div>
      </div>
    </MainLayout>
  );
}
