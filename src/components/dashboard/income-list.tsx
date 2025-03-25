"use client"

import { useState } from "react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";
import { Edit, Trash2, Calendar, CheckCircle, Pencil, Info } from "lucide-react";
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
import { formatCurrency } from "@/utils/financial-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface IncomeListProps {
  incomes: Income[];
  onEdit: (income: Partial<Income> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function IncomeList({ incomes, onEdit, onDelete }: IncomeListProps) {
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Sort by date
  const sortedIncomes = [...incomes].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const handleOpenEditDialog = (income: Income) => {
    setEditIncome(income);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (editIncome) {
      await onEdit({
        id: editIncome.id,
        ...values,
      });
      setEditDialogOpen(false);
      setEditIncome(null);
    }
  };

  // Check if date is in the past
  const isPast = (date: string) => {
    return isBefore(new Date(date), new Date());
  };

  // Check if date is coming soon (within 7 days)
  const isComingSoon = (date: string) => {
    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);
    const incomeDate = new Date(date);
    return isAfter(incomeDate, today) && isBefore(incomeDate, sevenDaysFromNow);
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
        <CardTitle>Income</CardTitle>
        <CardDescription>
          Manage your regular and one-time income sources
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sortedIncomes.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-semibold">No income added</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your income sources to track your cash flow
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedIncomes.map((income) => {
              const upcoming = !isPast(income.date);
              const soon = isComingSoon(income.date);
              
              return (
                <div
                  key={income.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="grid gap-1">
                    <div className="font-semibold">{income.name}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {income.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {FREQUENCY_LABEL[income.frequency] || income.frequency}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          upcoming 
                            ? "bg-green-100 text-green-800 hover:bg-green-100" 
                            : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }`}
                      >
                        {upcoming ? "Upcoming" : "Past"}
                      </Badge>
                      <span className="text-xs">
                        {format(parseISO(income.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    {income.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <Info className="h-3 w-3 inline-block mr-1" />
                        {income.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
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
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      {editIncome && (
        <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Income</AlertDialogTitle>
            </AlertDialogHeader>
            <IncomeForm
              income={editIncome}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditDialogOpen(false)}
            />
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this income from your records.
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