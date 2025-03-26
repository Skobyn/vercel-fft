"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AlertCircle, Calendar as CalendarIcon, CheckCircle, ChevronRight, HelpCircle, Plus, Database } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BulkBillsEditor } from "@/components/forms/bulk-bills-editor";
import { useExpenses } from "@/hooks/use-financial-data";
import { toast } from "sonner";

// Type definitions
type BillFrequency = "weekly" | "monthly" | "quarterly" | "annual" | "one-time";

type PaymentMethod = {
  id: string;
  name: string;
  type: "bank" | "card" | "cash" | "other";
  last4?: string;
};

type ExpenseCategory = {
  id: string;
  name: string;
  icon: string;
};

// Sample data
const paymentMethods: PaymentMethod[] = [
  { id: "1", name: "Chase Checking", type: "bank", last4: "4321" },
  { id: "2", name: "Wells Fargo Credit", type: "card", last4: "5678" },
  { id: "3", name: "Venmo", type: "other" },
  { id: "4", name: "Cash", type: "cash" },
];

const expenseCategories: ExpenseCategory[] = [
  { id: "1", name: "Housing", icon: "🏠" },
  { id: "2", name: "Utilities", icon: "💡" },
  { id: "3", name: "Transportation", icon: "🚗" },
  { id: "4", name: "Insurance", icon: "🛡️" },
  { id: "5", name: "Groceries", icon: "🛒" },
  { id: "6", name: "Healthcare", icon: "🏥" },
  { id: "7", name: "Entertainment", icon: "🎬" },
  { id: "8", name: "Subscriptions", icon: "📱" },
  { id: "9", name: "Memberships", icon: "🎯" },
  { id: "10", name: "Education", icon: "📚" },
  { id: "11", name: "Gifts", icon: "🎁" },
  { id: "12", name: "Holidays", icon: "🎄" },
  { id: "13", name: "Birthdays", icon: "🎂" },
  { id: "14", name: "Travel", icon: "✈️" },
  { id: "15", name: "Other", icon: "📋" },
];

// Main component
export default function BillsExpensesPage() {
  const router = useRouter();
  const { addExpense } = useExpenses();
  
  // Guide steps state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  // Form state
  const [billType, setBillType] = useState<"regular" | "special">("regular");
  const [billName, setBillName] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billFrequency, setBillFrequency] = useState<BillFrequency>("monthly");
  const [billCategory, setBillCategory] = useState("");
  const [billDate, setBillDate] = useState<Date | undefined>(new Date());
  const [billPaymentMethod, setBillPaymentMethod] = useState("");
  const [billIsAutomatic, setBillIsAutomatic] = useState(false);
  const [billHasReminders, setBillHasReminders] = useState(true);
  const [billReminderDays, setBillReminderDays] = useState<number[]>([7, 3, 1]);
  
  // Special expense state
  const [specialExpenseType, setSpecialExpenseType] = useState<"holiday" | "birthday" | "annual" | "other">("holiday");
  const [specialExpensePerson, setSpecialExpensePerson] = useState("");
  const [specialExpenseDate, setSpecialExpenseDate] = useState<Date | undefined>(new Date());
  const [specialExpenseBudget, setSpecialExpenseBudget] = useState("");
  
  // Bulk editor state
  const [bulkEditorOpen, setBulkEditorOpen] = useState(false);
  
  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSubmit = async () => {
    try {
      const expenseDate = billType === "regular" ? billDate : specialExpenseDate;
      if (!expenseDate) {
        toast.error("Please select a date");
        return;
      }

      const expenseData = {
        name: billName,
        amount: parseFloat(billAmount),
        category: billCategory,
        date: expenseDate.toISOString(),
        isPlanned: true,
        notes: billType === "special" ? `Special expense: ${specialExpenseType}${specialExpensePerson ? ` for ${specialExpensePerson}` : ''}` : undefined,
        frequency: billFrequency,
        paymentMethod: billPaymentMethod,
        isAutomatic: billIsAutomatic,
        hasReminders: billHasReminders,
        reminderDays: billReminderDays
      };

      await addExpense(expenseData);
      toast.success('Expense saved successfully');
      router.push('/bills');
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense. Please try again.");
    }
    
    // Reset form and go back to step 1
    setBillType("regular");
    setBillName("");
    setBillAmount("");
    setBillFrequency("monthly");
    setBillCategory("");
    setBillDate(new Date());
    setBillPaymentMethod("");
    setBillIsAutomatic(false);
    setBillHasReminders(true);
    setBillReminderDays([7, 3, 1]);
    setSpecialExpenseType("holiday");
    setSpecialExpensePerson("");
    setSpecialExpenseDate(new Date());
    setSpecialExpenseBudget("");
    setCurrentStep(1);
  };
  
  const handleBulkEdit = () => {
    setBulkEditorOpen(true);
  };
  
  const handleSaveBulkItems = async (items: any[]) => {
    try {
      for (const expense of items) {
        await addExpense({
          name: expense.name,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          isPlanned: true,
          notes: expense.notes || ""
        });
      }
      toast.success(`${items.length} expenses saved successfully`);
      setBulkEditorOpen(false);
      router.push('/bills'); // Navigate back to bills page
    } catch (error) {
      console.error("Error saving bulk expenses:", error);
      toast.error("Failed to save all expenses. Please try again.");
    }
  };
  
  // Helper function to get weekly options
  const getWeeklyOptions = () => {
    return [
      { value: "sunday", label: "Every Sunday" },
      { value: "monday", label: "Every Monday" },
      { value: "tuesday", label: "Every Tuesday" },
      { value: "wednesday", label: "Every Wednesday" },
      { value: "thursday", label: "Every Thursday" },
      { value: "friday", label: "Every Friday" },
      { value: "saturday", label: "Every Saturday" },
    ];
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Bills & Expenses</h1>
            <p className="text-muted-foreground">
              Track your recurring bills and plan for special expenses
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/bills')}>
              Go Back
            </Button>
            <Button variant="outline" onClick={handleBulkEdit}>
              <Database className="h-4 w-4 mr-2" />
              Bulk Add
            </Button>
          </div>
        </div>
        
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Expense Setup Guide</CardTitle>
            <CardDescription>
              Follow the steps below to set up your expense or bill
            </CardDescription>
            <Progress value={(currentStep / totalSteps) * 100} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="pb-6">
            {/* Step 1: Choose Expense Type */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">What type of expense would you like to add?</h2>
                <Tabs 
                  defaultValue="regular" 
                  value={billType}
                  onValueChange={(value) => setBillType(value as "regular" | "special")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="regular">Regular Bill</TabsTrigger>
                    <TabsTrigger value="special">Special Expense</TabsTrigger>
                  </TabsList>
                  <TabsContent value="regular" className="mt-4">
                    <div className="space-y-4">
                      <p>A regular bill is a recurring expense such as:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Monthly utilities (electricity, water, internet)</li>
                        <li>Rent or mortgage payments</li>
                        <li>Subscription services</li>
                        <li>Insurance premiums</li>
                      </ul>
                    </div>
                  </TabsContent>
                  <TabsContent value="special" className="mt-4">
                    <div className="space-y-4">
                      <p>A special expense is an occasional or one-time expense such as:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Holiday gifts and celebrations</li>
                        <li>Birthday presents</li>
                        <li>Annual memberships</li>
                        <li>Vacations and travel</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {/* Step 2: Basic Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Enter the basic details</h2>
                
                {billType === "regular" ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="billName">Bill Name</Label>
                      <Input
                        id="billName"
                        placeholder="e.g. Internet Subscription, Electricity Bill"
                        value={billName}
                        onChange={(e) => setBillName(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="billAmount">Amount</Label>
                      <Input
                        id="billAmount"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="billFrequency">How often do you pay this bill?</Label>
                      <Select 
                        value={billFrequency} 
                        onValueChange={(value) => setBillFrequency(value as BillFrequency)}
                      >
                        <SelectTrigger id="billFrequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="one-time">One-time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="billCategory">Category</Label>
                      <Select 
                        value={billCategory} 
                        onValueChange={setBillCategory}
                      >
                        <SelectTrigger id="billCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <span className="flex items-center">
                                <span className="mr-2">{category.icon}</span>
                                {category.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="specialType">What kind of special expense is this?</Label>
                      <Select 
                        value={specialExpenseType} 
                        onValueChange={(value) => setSpecialExpenseType(value as any)}
                      >
                        <SelectTrigger id="specialType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="holiday">Holiday</SelectItem>
                          <SelectItem value="birthday">Birthday</SelectItem>
                          <SelectItem value="annual">Annual Event</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="expenseName">Expense Name</Label>
                      <Input
                        id="expenseName"
                        placeholder={specialExpenseType === "birthday" ? "e.g. Mom's Birthday" : "e.g. Christmas, Anniversary"}
                        value={billName}
                        onChange={(e) => setBillName(e.target.value)}
                      />
                    </div>
                    
                    {specialExpenseType === "birthday" && (
                      <div className="grid gap-2">
                        <Label htmlFor="person">Person</Label>
                        <Input
                          id="person"
                          placeholder="e.g. Mom, Dad, Sarah"
                          value={specialExpensePerson}
                          onChange={(e) => setSpecialExpensePerson(e.target.value)}
                        />
                      </div>
                    )}
                    
                    <div className="grid gap-2">
                      <Label htmlFor="expenseBudget">Budget Amount</Label>
                      <Input
                        id="expenseBudget"
                        placeholder="0.00"
                        type="number"
                        step="0.01"
                        value={specialExpenseBudget}
                        onChange={(e) => setSpecialExpenseBudget(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="billCategory">Category</Label>
                      <Select 
                        value={billCategory} 
                        onValueChange={setBillCategory}
                      >
                        <SelectTrigger id="billCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <span className="flex items-center">
                                <span className="mr-2">{category.icon}</span>
                                {category.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 3: Timing & Dates */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">When does this {billType === "regular" ? "bill occur" : "expense happen"}?</h2>
                
                {billType === "regular" ? (
                  <div className="space-y-4">
                    {billFrequency === "weekly" ? (
                      <div className="grid gap-2">
                        <Label htmlFor="weeklyDay">Which day of the week?</Label>
                        <Select 
                          value={(billDate?.getDay() || 0).toString()} 
                          onValueChange={(value) => {
                            const newDate = new Date();
                            newDate.setDate(newDate.getDate() + ((parseInt(value) - newDate.getDay() + 7) % 7));
                            setBillDate(newDate);
                          }}
                        >
                          <SelectTrigger id="weeklyDay">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Sunday</SelectItem>
                            <SelectItem value="1">Monday</SelectItem>
                            <SelectItem value="2">Tuesday</SelectItem>
                            <SelectItem value="3">Wednesday</SelectItem>
                            <SelectItem value="4">Thursday</SelectItem>
                            <SelectItem value="5">Friday</SelectItem>
                            <SelectItem value="6">Saturday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        <Label htmlFor="billDate">Due Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !billDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {billDate ? format(billDate, "PPP") : "Select date"}
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
                        
                        {billFrequency === "monthly" && (
                          <p className="text-sm text-muted-foreground">
                            This bill will be due on day {billDate?.getDate()} of each month.
                          </p>
                        )}
                        
                        {billFrequency === "quarterly" && (
                          <p className="text-sm text-muted-foreground">
                            This bill will be due every 3 months on {format(billDate || new Date(), "PP")}.
                          </p>
                        )}
                        
                        {billFrequency === "annual" && (
                          <p className="text-sm text-muted-foreground">
                            This bill will be due once a year on {format(billDate || new Date(), "PP")}.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="specialDate">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !specialExpenseDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {specialExpenseDate ? format(specialExpenseDate, "PPP") : "Select date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={specialExpenseDate}
                            onSelect={setSpecialExpenseDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      {specialExpenseType === "birthday" && (
                        <div className="flex items-center mt-2">
                          <Checkbox
                            id="recurAnnually"
                            checked={true}
                            className="mr-2"
                            disabled
                          />
                          <Label htmlFor="recurAnnually" className="text-sm">
                            This expense recurs annually
                          </Label>
                        </div>
                      )}
                      
                      {specialExpenseType === "holiday" && (
                        <div className="flex items-center mt-2">
                          <Checkbox
                            id="recurAnnually"
                            checked={true}
                            className="mr-2"
                            disabled
                          />
                          <Label htmlFor="recurAnnually" className="text-sm">
                            This expense recurs annually
                          </Label>
                        </div>
                      )}
                    </div>
                    
                    <Alert variant="default" className="bg-blue-50 border-blue-100">
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800">Planning ahead!</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Setting up special occasions helps you budget for gifts and celebrations in advance.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 4: Payment Details (only for regular bills) */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {billType === "regular" ? (
                  <>
                    <h2 className="text-xl font-semibold">Payment Details</h2>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select 
                          value={billPaymentMethod} 
                          onValueChange={setBillPaymentMethod}
                        >
                          <SelectTrigger id="paymentMethod">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id}>
                                {method.name} {method.last4 ? `(${method.last4})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox
                          id="automatic"
                          checked={billIsAutomatic}
                          onCheckedChange={(checked) => setBillIsAutomatic(checked as boolean)}
                        />
                        <Label htmlFor="automatic">This bill is paid automatically</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox
                          id="reminders"
                          checked={billHasReminders}
                          onCheckedChange={(checked) => setBillHasReminders(checked as boolean)}
                        />
                        <Label htmlFor="reminders">Send me reminders</Label>
                      </div>
                      
                      {billHasReminders && (
                        <div className="ml-6 mt-2 space-y-2">
                          <p className="text-sm font-medium">Remind me</p>
                          <div className="flex flex-wrap gap-2">
                            {[1, 3, 7, 14, 30].map((days) => (
                              <div key={days} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`reminder-${days}`}
                                  checked={billReminderDays.includes(days)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setBillReminderDays([...billReminderDays, days].sort((a, b) => b - a));
                                    } else {
                                      setBillReminderDays(billReminderDays.filter(d => d !== days));
                                    }
                                  }}
                                />
                                <Label htmlFor={`reminder-${days}`} className="text-sm">{days} days before</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold">Reminder Settings</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="reminders"
                          checked={billHasReminders}
                          onCheckedChange={(checked) => setBillHasReminders(checked as boolean)}
                        />
                        <Label htmlFor="reminders">Send me reminders to prepare for this expense</Label>
                      </div>
                      
                      {billHasReminders && (
                        <div className="ml-6 mt-2 space-y-2">
                          <p className="text-sm font-medium">Remind me</p>
                          <div className="flex flex-wrap gap-2">
                            {[7, 14, 30, 60, 90].map((days) => (
                              <div key={days} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`reminder-${days}`}
                                  checked={billReminderDays.includes(days)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setBillReminderDays([...billReminderDays, days].sort((a, b) => b - a));
                                    } else {
                                      setBillReminderDays(billReminderDays.filter(d => d !== days));
                                    }
                                  }}
                                />
                                <Label htmlFor={`reminder-${days}`} className="text-sm">{days} days before</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Step 5: Review and confirm */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Review and confirm</h2>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Type</p>
                          <p>{billType === "regular" ? "Regular Bill" : "Special Expense"}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Name</p>
                          <p>{billName || "Not specified"}</p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            {billType === "regular" ? "Amount" : "Budget"}
                          </p>
                          <p>${billType === "regular" ? billAmount : specialExpenseBudget || "0.00"}</p>
                        </div>
                        
                        {billType === "regular" && (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                            <p>{billFrequency.charAt(0).toUpperCase() + billFrequency.slice(1)}</p>
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Category</p>
                          <p>
                            {billCategory ? 
                              expenseCategories.find(c => c.id === billCategory)?.name || "Not specified" : 
                              "Not specified"}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Date</p>
                          <p>
                            {billType === "regular" ? 
                              (billDate ? format(billDate, "PPP") : "Not specified") : 
                              (specialExpenseDate ? format(specialExpenseDate, "PPP") : "Not specified")}
                          </p>
                        </div>
                        
                        {billType === "regular" && (
                          <>
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                              <p>
                                {billPaymentMethod ? 
                                  paymentMethods.find(m => m.id === billPaymentMethod)?.name || "Not specified" : 
                                  "Not specified"}
                              </p>
                            </div>
                            
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-muted-foreground">Automatic Payment</p>
                              <p>{billIsAutomatic ? "Yes" : "No"}</p>
                            </div>
                          </>
                        )}
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Reminders</p>
                          <p>
                            {billHasReminders ? 
                              (billReminderDays.length > 0 ? 
                                `${billReminderDays.join(", ")} days before` : 
                                "Enabled, no days selected") : 
                              "No reminders"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Alert variant="default" className="bg-green-50 border-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Ready to submit!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Review the details above and click "Save" when you're ready to add this {billType}.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            
            <Button
              onClick={currentStep < totalSteps ? nextStep : handleSubmit}
            >
              {currentStep < totalSteps ? "Continue" : "Save"}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Bulk Editor Dialog */}
        <Dialog open={bulkEditorOpen} onOpenChange={setBulkEditorOpen}>
          <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto">
            <BulkBillsEditor
              type="expenses"
              onSave={handleSaveBulkItems}
              onCancel={() => setBulkEditorOpen(false)}
              existingItems={[]}
            />
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
} 