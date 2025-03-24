"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Plus, Calendar as CalendarIcon, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { SubscriptionManager } from "@/components/subscriptions/subscription-manager";
import { useAuth } from "@/providers/firebase-auth-provider";

type Bill = {
  id: number;
  name: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "annual" | "one-time";
  dueDate: string;
  paymentMethod: string;
  isPaid: boolean;
  category: string;
  isAutomatic: boolean;
  reminders: number[];
};

export default function BillsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [openNewBillDialog, setOpenNewBillDialog] = useState(false);
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billFrequency, setBillFrequency] = useState<Bill["frequency"]>("monthly");
  const [billDate, setBillDate] = useState<Date | undefined>(new Date());
  const [billPaymentMethod, setBillPaymentMethod] = useState("");
  const [billCategory, setBillCategory] = useState("");
  const [billIsAutomatic, setBillIsAutomatic] = useState(false);
  const [billReminders, setBillReminders] = useState<number[]>([7, 3, 1]); // Days before
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  // Sample bills data
  const bills: Bill[] = [
    {
      id: 1,
      name: "Mortgage",
      amount: 1200.00,
      frequency: "monthly",
      dueDate: "2025-04-01",
      paymentMethod: "Bank Transfer",
      isPaid: false,
      category: "Housing",
      isAutomatic: true,
      reminders: [7, 3, 1],
    },
    {
      id: 2,
      name: "Electricity",
      amount: 85.50,
      frequency: "monthly",
      dueDate: "2025-03-28",
      paymentMethod: "Credit Card",
      isPaid: false,
      category: "Utilities",
      isAutomatic: true,
      reminders: [5, 1],
    },
    {
      id: 3,
      name: "Internet",
      amount: 69.99,
      frequency: "monthly",
      dueDate: "2025-04-05",
      paymentMethod: "Credit Card",
      isPaid: false,
      category: "Utilities",
      isAutomatic: true,
      reminders: [3],
    },
    {
      id: 4,
      name: "Car Insurance",
      amount: 450.00,
      frequency: "quarterly",
      dueDate: "2025-05-15",
      paymentMethod: "Bank Transfer",
      isPaid: false,
      category: "Insurance",
      isAutomatic: false,
      reminders: [14, 7, 3],
    },
    {
      id: 5,
      name: "Property Tax",
      amount: 2400.00,
      frequency: "annual",
      dueDate: "2025-11-01",
      paymentMethod: "Bank Transfer",
      isPaid: false,
      category: "Taxes",
      isAutomatic: false,
      reminders: [30, 14, 7],
    },
    {
      id: 6,
      name: "Netflix",
      amount: 15.99,
      frequency: "monthly",
      dueDate: "2025-04-18",
      paymentMethod: "Credit Card",
      isPaid: false,
      category: "Entertainment",
      isAutomatic: true,
      reminders: [1],
    },
    {
      id: 7,
      name: "Amazon Prime",
      amount: 139.00,
      frequency: "annual",
      dueDate: "2025-09-20",
      paymentMethod: "Credit Card",
      isPaid: false,
      category: "Shopping",
      isAutomatic: true,
      reminders: [14, 7],
    },
    {
      id: 8,
      name: "Water Bill",
      amount: 45.25,
      frequency: "quarterly",
      dueDate: "2025-06-10",
      paymentMethod: "Bank Transfer",
      isPaid: false,
      category: "Utilities",
      isAutomatic: false,
      reminders: [7, 3],
    },
  ];

  // Get unique categories for the filter
  const categories = Array.from(new Set(bills.map(b => b.category)));

  // Filter bills based on search and category
  const filteredBills = bills.filter(bill => {
    const matchesSearch = searchText === "" ||
      bill.name.toLowerCase().includes(searchText.toLowerCase()) ||
      bill.category.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = selectedCategory === null || bill.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Separate bills by status for tabs
  const upcomingBills = filteredBills.filter(bill => !bill.isPaid && new Date(bill.dueDate) >= new Date());
  const paidBills = filteredBills.filter(bill => bill.isPaid);
  const lateBills = filteredBills.filter(bill => !bill.isPaid && new Date(bill.dueDate) < new Date());

  // Function to determine if a bill is due soon (within 3 days)
  const isDueSoon = (date: string) => {
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  // Function to handle adding a new bill
  const handleAddBill = () => {
    // In a real app, this would add the bill to the database
    console.log("Adding new bill:", {
      name: billName,
      amount: parseFloat(billAmount),
      frequency: billFrequency,
      dueDate: billDate,
      paymentMethod: billPaymentMethod,
      category: billCategory,
      isAutomatic: billIsAutomatic,
      reminders: billReminders,
    });

    // Reset form
    setBillName("");
    setBillAmount("");
    setBillFrequency("monthly");
    setBillDate(new Date());
    setBillPaymentMethod("");
    setBillCategory("");
    setBillIsAutomatic(false);
    setBillReminders([7, 3, 1]);

    // Close dialog
    setOpenNewBillDialog(false);
  };

  // Function to render bill status badge
  const renderBillStatus = (bill: Bill) => {
    if (bill.isPaid) {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Paid</Badge>;
    } else if (new Date(bill.dueDate) < new Date()) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Overdue</Badge>;
    } else if (isDueSoon(bill.dueDate)) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Due Soon</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  // Function to render bill frequency badge
  const renderFrequency = (frequency: Bill["frequency"]) => {
    switch (frequency) {
      case "monthly":
        return <Badge variant="secondary">Monthly</Badge>;
      case "quarterly":
        return <Badge variant="secondary">Quarterly</Badge>;
      case "annual":
        return <Badge variant="secondary">Annual</Badge>;
      case "one-time":
        return <Badge variant="secondary">One-time</Badge>;
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
            <p className="text-muted-foreground">
              Manage your recurring and one-time payments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SubscriptionManager />
            <Dialog open={openNewBillDialog} onOpenChange={setOpenNewBillDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Bill
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Bill</DialogTitle>
                  <DialogDescription>
                    Enter the details for your new bill or payment.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="billName">Bill Name</Label>
                    <Input
                      id="billName"
                      value={billName}
                      onChange={(e) => setBillName(e.target.value)}
                      placeholder="e.g. Electricity"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      value={billAmount}
                      onChange={(e) => setBillAmount(e.target.value)}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={billFrequency} onValueChange={(value: Bill["frequency"]) => setBillFrequency(value)}>
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select Frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !billDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {billDate ? format(billDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={billDate}
                          onSelect={setBillDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={billCategory} onValueChange={setBillCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Housing">Housing</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Subscriptions">Subscriptions</SelectItem>
                        <SelectItem value="Taxes">Taxes</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={billPaymentMethod} onValueChange={setBillPaymentMethod}>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue placeholder="Select Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                        <SelectItem value="Debit Card">Debit Card</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Check">Check</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenNewBillDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddBill}>
                    Add Bill
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              className="pl-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="flex flex-1 items-center gap-2">
            <Select value={selectedCategory || ""} onValueChange={(value) => setSelectedCategory(value || null)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming
              {upcomingBills.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingBills.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="due-soon">
              Due Soon
              {upcomingBills.filter(bill => isDueSoon(bill.dueDate)).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {upcomingBills.filter(bill => isDueSoon(bill.dueDate)).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="late">
              Late
              {lateBills.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {lateBills.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid">
              Paid
              {paidBills.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {paidBills.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Bills</CardTitle>
                <CardDescription>Bills that are scheduled for future payment.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {upcomingBills.length > 0 ? (
                    upcomingBills.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{bill.name}</h3>
                            {renderFrequency(bill.frequency)}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(bill.dueDate).toLocaleDateString()}
                            </p>
                            {renderBillStatus(bill)}
                          </div>
                          <p className="text-sm text-muted-foreground">{bill.category}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold">${bill.amount.toFixed(2)}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {bill.isAutomatic ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                <span>Auto-pay</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                <span>Manual</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <p>No upcoming bills found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="due-soon" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bills Due Soon</CardTitle>
                <CardDescription>Bills due within the next 3 days.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {upcomingBills.filter(bill => isDueSoon(bill.dueDate)).length > 0 ? (
                    upcomingBills.filter(bill => isDueSoon(bill.dueDate)).map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{bill.name}</h3>
                            {renderFrequency(bill.frequency)}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(bill.dueDate).toLocaleDateString()}
                            </p>
                            {renderBillStatus(bill)}
                          </div>
                          <p className="text-sm text-muted-foreground">{bill.category}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold">${bill.amount.toFixed(2)}</span>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {bill.isAutomatic ? (
                              <>
                                <CheckCircle className="h-3 w-3" />
                                <span>Auto-pay</span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-3 w-3" />
                                <span>Manual</span>
                              </>
                            )}
                          </div>
                          <Button size="sm" className="mt-2">
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <p>No bills due soon.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="late" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Late Bills</CardTitle>
                <CardDescription>Bills that are past their due date.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {lateBills.length > 0 ? (
                    lateBills.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{bill.name}</h3>
                            {renderFrequency(bill.frequency)}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(bill.dueDate).toLocaleDateString()}
                            </p>
                            {renderBillStatus(bill)}
                          </div>
                          <p className="text-sm text-muted-foreground">{bill.category}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold">${bill.amount.toFixed(2)}</span>
                          <Button size="sm" className="mt-2">
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <p>No late bills. Good job!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Paid Bills</CardTitle>
                <CardDescription>Bills that have been paid.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {paidBills.length > 0 ? (
                    paidBills.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{bill.name}</h3>
                            {renderFrequency(bill.frequency)}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              Paid: {new Date(bill.dueDate).toLocaleDateString()}
                            </p>
                            {renderBillStatus(bill)}
                          </div>
                          <p className="text-sm text-muted-foreground">{bill.category}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold">${bill.amount.toFixed(2)}</span>
                          <span className="text-xs text-muted-foreground">
                            {bill.paymentMethod}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      <p>No paid bills found.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
