"use client"

import { useState } from "react";
import { Plus, Pencil, CheckCircle, CalendarCheck } from "lucide-react";
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
import { Bill } from "@/types/financial";
import { useBills } from "@/hooks/use-financial-data";
import BillForm from "@/components/forms/bill-form";
import { formatCurrency, formatDate, isOverdue, daysUntil } from "@/utils/financial-utils";
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

export function BillsList() {
  const { bills, addBill, updateBill, deleteBill, markBillAsPaid, loading, error } = useBills();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentBill, setCurrentBill] = useState<Bill | undefined>(undefined);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [billToPay, setBillToPay] = useState<string | null>(null);

  const handleOpenAddDialog = () => {
    setCurrentBill(undefined);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (bill: Bill) => {
    setCurrentBill(bill);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      console.log("Attempting to save bill:", values);
      setIsSubmitting(true);
      const formattedValues = {
        ...values,
        dueDate: values.dueDate.toISOString(),
      };
      console.log("Formatted bill values:", formattedValues);

      if (currentBill) {
        console.log("Updating existing bill:", currentBill.id);
        await updateBill({
          id: currentBill.id,
          ...formattedValues,
        });
      } else {
        console.log("Adding new bill");
        const newBill = await addBill(formattedValues);
        console.log("New bill created with ID:", newBill?.id);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving bill:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setBillToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (billToDelete) {
      try {
        await deleteBill(billToDelete);
        setDeleteDialogOpen(false);
        setBillToDelete(null);
      } catch (error) {
        console.error("Error deleting bill:", error);
      }
    }
  };

  const handlePayClick = (id: string) => {
    setBillToPay(id);
    setPayDialogOpen(true);
  };

  const confirmPay = async () => {
    if (billToPay) {
      try {
        await markBillAsPaid(billToPay);
        setPayDialogOpen(false);
        setBillToPay(null);
      } catch (error) {
        console.error("Error marking bill as paid:", error);
      }
    }
  };

  // Filter unpaid bills due in the next 7 days
  const unpaidBills = bills.filter(bill => !bill.isPaid);
  
  // Get today's date and 7 days from now
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  // Filter for bills due within the next 7 days
  const upcomingBills = unpaidBills.filter(bill => {
    const dueDate = new Date(bill.dueDate);
    return dueDate <= nextWeek;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const billsRemainingCount = unpaidBills.length - upcomingBills.length;

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
          <CardTitle>Bills</CardTitle>
          <CardDescription>Error loading your bills</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-500">
            {error.message || "Failed to load bill information"}
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
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>Due in the next 7 days</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenAddDialog} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {currentBill ? "Edit Bill" : "Add Bill"}
                </DialogTitle>
              </DialogHeader>
              <BillForm
                bill={currentBill}
                onSubmit={handleSubmit}
                onCancel={() => setDialogOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {unpaidBills.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarCheck className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No upcoming bills</p>
            <Button
              variant="link"
              onClick={handleOpenAddDialog}
              className="mt-2"
            >
              Add your first bill
            </Button>
          </div>
        ) : upcomingBills.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <CalendarCheck className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No bills due in the next 7 days</p>
            <p className="text-xs mt-1">You have {unpaidBills.length} bills due later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between border-b last:border-b-0 pb-3 last:pb-0"
                onClick={() => handlePayClick(bill.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{bill.name}</p>
                    {isOverdue(bill.dueDate) && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                    {bill.autoPay && <Badge variant="outline">Auto-pay</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <p>
                      Due {formatDate(bill.dueDate, "long")} (
                      {daysUntil(bill.dueDate)})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditDialog(bill);
                        }}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePayClick(bill.id);
                        }}
                      >
                        Mark as Paid
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(bill.id);
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {billsRemainingCount > 0 && (
              <div className="pt-2 text-center">
                <Button variant="link" size="sm" asChild>
                  <a href="/bills">View all {billsRemainingCount} additional bills</a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bill? This action cannot be
              undone.
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

      <AlertDialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this bill as paid?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPay}>
              Mark as Paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 