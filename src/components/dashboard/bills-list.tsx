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
      setIsSubmitting(true);
      const formattedValues = {
        ...values,
        dueDate: values.dueDate.toISOString(),
      };

      if (currentBill) {
        await updateBill({
          id: currentBill.id,
          ...formattedValues,
        });
      } else {
        await addBill(formattedValues);
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

  // Filter unpaid bills
  const unpaidBills = bills.filter(bill => !bill.isPaid);

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
            <CardTitle>Bills</CardTitle>
            <CardDescription>Manage your upcoming bills</CardDescription>
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
        ) : (
          <div className="space-y-4">
            {unpaidBills.map((bill) => {
              const overdue = isOverdue(bill.dueDate);
              const days = daysUntil(bill.dueDate);
              
              return (
                <div
                  key={bill.id}
                  className={`flex justify-between items-center border rounded-lg p-3 hover:bg-muted/50 transition-colors ${
                    overdue ? "border-red-200 bg-red-50" : days <= 3 ? "border-amber-200 bg-amber-50" : ""
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{bill.name}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {bill.category}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {FREQUENCY_LABEL[bill.frequency] || bill.frequency}
                      </Badge>
                      {bill.isAutoPay && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                          Auto Pay
                        </Badge>
                      )}
                      <span className={`text-xs ${overdue ? "text-red-600 font-medium" : ""}`}>
                        {overdue
                          ? `Overdue by ${days} days`
                          : days === 0
                          ? "Due today"
                          : `Due in ${days} days`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-red-600">
                      {formatCurrency(bill.amount)}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handlePayClick(bill.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Pay
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenEditDialog(bill)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteClick(bill.id)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bill from your records.
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

      <AlertDialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Paid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the bill as paid. For recurring bills, a new upcoming bill will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPay}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark as Paid
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
} 