"use client"

import { useState } from "react";
import { Plus, Pencil, Trash, CalendarClock } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Income } from "@/types/financial";
import { useIncomes } from "@/hooks/use-financial-data";
import IncomeForm from "@/components/forms/income-form";
import { formatCurrency, formatDate } from "@/utils/financial-utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const FREQUENCY_LABEL: Record<string, string> = {
  once: "One Time",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannually: "Semi-Annually",
  annually: "Annually",
};

export function IncomeList() {
  const { incomes, addIncome, updateIncome, deleteIncome, loading, error } = useIncomes();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIncome, setCurrentIncome] = useState<Income | undefined>(undefined);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);

  const handleOpenAddDialog = () => {
    setCurrentIncome(undefined);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (income: Income) => {
    setCurrentIncome(income);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const formattedValues = {
        ...values,
        date: values.date.toISOString(),
      };

      if (currentIncome) {
        await updateIncome({
          id: currentIncome.id,
          ...formattedValues,
        });
      } else {
        await addIncome(formattedValues);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving income:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setIncomeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (incomeToDelete) {
      try {
        await deleteIncome(incomeToDelete);
        setDeleteDialogOpen(false);
        setIncomeToDelete(null);
      } catch (error) {
        console.error("Error deleting income:", error);
      }
    }
  };

  if (loading) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Income</CardTitle>
          <CardDescription>Error loading your income</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">
            {error.message || "Failed to load income information"}
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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Income</CardTitle>
            <CardDescription>Manage your sources of income</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentIncome ? "Edit Income" : "Add Income"}
                </DialogTitle>
              </DialogHeader>
              <IncomeForm
                income={currentIncome}
                onSubmit={handleSubmit}
                onCancel={() => setDialogOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {incomes.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarClock className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No income sources added yet</p>
            <Button
              variant="link"
              onClick={handleOpenAddDialog}
              className="mt-2"
            >
              Add your first income source
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {incomes.map((income) => (
              <div
                key={income.id}
                className="flex justify-between items-center border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{income.name}</div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {income.category}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {FREQUENCY_LABEL[income.frequency] || income.frequency}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Next: {formatDate(income.date, "long")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(income.amount)}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleOpenEditDialog(income)}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteClick(income.id)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this income source from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 