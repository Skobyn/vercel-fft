"use client"

import { useState } from "react";
import { ArrowUpCircle, ArrowDownCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FinancialProfile } from "@/types/financial";
import { formatCurrency } from "@/utils/financial-utils";
import BalanceForm from "@/components/forms/balance-form";
import { useFinancialProfile } from "@/hooks/use-financial-data";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function BalanceCard() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { profile, updateBalance, loading, error } = useFinancialProfile();

  const handleUpdateBalance = async (values: { newBalance: number; reason: string }) => {
    try {
      setIsSubmitting(true);
      await updateBalance(values.newBalance, values.reason);
      setOpen(false);
    } catch (error) {
      console.error("Failed to update balance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-[180px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  if (error || !profile) {
    return (
      <Card className="h-[180px]">
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Error loading your balance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">
            {error?.message || "Failed to load balance information"}
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const formattedBalance = formatCurrency(profile.currentBalance, profile.currency);
  const formattedDate = new Date(profile.lastUpdated).toLocaleDateString();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Current Balance</CardTitle>
            <CardDescription>Last updated: {formattedDate}</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Your Balance</DialogTitle>
              </DialogHeader>
              <BalanceForm
                profile={profile}
                onSubmit={handleUpdateBalance}
                onCancel={() => setOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{formattedBalance}</div>
      </CardContent>
    </Card>
  );
} 