"use client"

import { useState, useMemo } from "react";
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
import { IncomeForm } from "@/components/forms/income-form";
import { formatCurrency } from "@/utils/financial-utils";
import { toast } from "sonner";
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
  loading?: boolean;
  error?: Error | null;
}

export function IncomeList({ incomes, onEdit, onDelete, loading, error }: IncomeListProps) {
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get today's date and 30 days from now
  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(today.getDate() + 30);
  
  // Generate all income occurrences for the next 30 days
  const upcomingIncomes = useMemo(() => {
    const occurrences: Income[] = [];
    
    // Process each income
    incomes.forEach(income => {
      // If it's a one-time income and falls within the next 30 days, add it
      if (!income.isRecurring) {
        const incomeDate = new Date(income.date);
        if (incomeDate >= today && incomeDate <= nextMonth) {
          occurrences.push(income);
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
          currentDate.setDate(currentDate.getDate() + daysToAdd);
        } else if (frequency === 'biweekly') {
          const biweeksElapsed = Math.ceil(daysElapsed / 14);
          const daysToAdd = biweeksElapsed * 14;
          currentDate.setDate(currentDate.getDate() + daysToAdd);
        } else if (frequency === 'monthly') {
          const monthsElapsed = Math.ceil(daysElapsed / 30);
          currentDate.setMonth(currentDate.getMonth() + monthsElapsed);
        } else if (frequency === 'quarterly') {
          const quartersElapsed = Math.ceil(daysElapsed / 90);
          currentDate.setMonth(currentDate.getMonth() + (quartersElapsed * 3));
        } else if (frequency === 'annually') {
          const yearsElapsed = Math.ceil(daysElapsed / 365);
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
        
        // Calculate next occurrence based on frequency
        if (frequency === 'daily') {
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (frequency === 'weekly') {
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (frequency === 'biweekly') {
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() + 14);
        } else if (frequency === 'monthly') {
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (frequency === 'quarterly') {
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + 3);
        } else if (frequency === 'annually') {
          currentDate = new Date(currentDate);
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else {
          // Skip if it's not a recognized frequency
          break;
        }
      }
    });
    
    // Sort by date
    return occurrences.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [incomes, today, nextMonth]);

  const handleOpenEditDialog = (income: Income) => {
    // If it's a generated occurrence, find the original income to edit
    const originalId = (income as any).originalId || income.id;
    const originalIncome = incomes.find(inc => inc.id === originalId);
    
    if (originalIncome) {
      setEditIncome(originalIncome);
      setEditDialogOpen(true);
    } else {
      setEditIncome(income);
      setEditDialogOpen(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    // If it's a generated occurrence, get the original ID
    const originalId = incomes.find(inc => inc.id === id) ? 
      id : 
      incomes.find(inc => inc.id === id.split('-')[0])?.id || id;
    
    setDeleteId(originalId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      console.log("Attempting to save income:", values);
      setIsSubmitting(true);
      const formattedValues = {
        ...values,
        date: values.date.toISOString(),
      };
      console.log("Formatted income values:", formattedValues);

      if (editIncome) {
        console.log("Updating existing income:", editIncome.id);
        await onEdit({
          id: editIncome.id,
          ...formattedValues,
        });
        setEditDialogOpen(false);
      } else {
        console.log("Adding new income");
        console.log("Cannot add new income through this interface");
        toast.error("Adding new income is not supported in this view");
      }
    } catch (error) {
      console.error("Error saving income:", error);
    } finally {
      setIsSubmitting(false);
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
        <CardTitle>Expected Income</CardTitle>
        <CardDescription>
          {upcomingIncomes.length > 0 ? `${upcomingIncomes.length} income entries in the next 30 days` : "No upcoming income"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {incomes.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground opacity-20" />
            <h3 className="mt-4 text-lg font-semibold">No income added</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your income sources to track your cash flow
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(upcomingIncomes.length > 0 ? upcomingIncomes : incomes).map((income) => (
              <div
                key={income.id}
                className="flex items-center justify-between border-b last:border-b-0 pb-3 last:pb-0"
              >
                <div className="space-y-1">
                  <div className="font-medium flex items-center gap-2">
                    {income.name}
                    {income.isRecurring && (
                      <Badge variant="outline" className="text-xs">
                        {FREQUENCY_LABEL[income.frequency] || 'Recurring'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>
                      {income.isRecurring 
                        ? `Next: ${format(parseISO(income.date), "MMM d, yyyy")}` 
                        : `${format(parseISO(income.date), "MMM d, yyyy")}`}
                      {isComingSoon(income.date) && !isPast(income.date) && (
                        <Badge variant="outline" className="ml-2 text-xs">Soon</Badge>
                      )}
                      {isPast(income.date) && !income.isRecurring && (
                        <Badge variant="outline" className="ml-2 text-xs bg-muted">Past</Badge>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-green-600">{formatCurrency(income.amount)}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Income</DialogTitle>
          </DialogHeader>
          {editIncome && (
            <IncomeForm
              income={editIncome}
              onSubmit={handleSubmit}
              onCancel={() => setEditDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 