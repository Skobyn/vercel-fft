"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, addMonths, addYears, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  RotateCcw,
  CalendarClock,
  Bell,
  BellOff,
  Calendar as CalendarIcon,
  DollarSign,
  Plus,
  RefreshCcw,
  CreditCardIcon,
  AlertCircle,
  Edit,
  Trash2,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";

type BillingCycle = "weekly" | "monthly" | "quarterly" | "annual" | "custom";

interface Subscription {
  id: string;
  name: string;
  description?: string;
  amount: number;
  billingCycle: BillingCycle;
  nextBillingDate: Date;
  category: string;
  paymentMethod?: string;
  active: boolean;
  logoUrl?: string;
  startDate: Date;
  reminders: boolean;
  reminderDays: number[];
  autoRenewal: boolean;
  tags?: string[];
}

export function SubscriptionManager() {
  const [open, setOpen] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [newSubscription, setNewSubscription] = useState<Partial<Subscription>>({
    name: "",
    amount: 0,
    billingCycle: "monthly",
    nextBillingDate: new Date(),
    category: "entertainment",
    active: true,
    startDate: new Date(),
    reminders: true,
    reminderDays: [7],
    autoRenewal: true,
  });

  // Sample subscription data
  const subscriptions: Subscription[] = [
    {
      id: "sub-1",
      name: "Netflix",
      description: "Standard streaming plan",
      amount: 15.99,
      billingCycle: "monthly",
      nextBillingDate: new Date("2025-04-15"),
      category: "entertainment",
      paymentMethod: "Visa *1234",
      active: true,
      logoUrl: "https://placehold.co/50x50?text=N",
      startDate: new Date("2024-01-15"),
      reminders: true,
      reminderDays: [3],
      autoRenewal: true,
      tags: ["streaming", "entertainment"]
    },
    {
      id: "sub-2",
      name: "Spotify",
      description: "Family plan",
      amount: 9.99,
      billingCycle: "monthly",
      nextBillingDate: new Date("2025-04-05"),
      category: "entertainment",
      paymentMethod: "Mastercard *5678",
      active: true,
      logoUrl: "https://placehold.co/50x50?text=S",
      startDate: new Date("2024-02-05"),
      reminders: true,
      reminderDays: [3, 1],
      autoRenewal: true,
      tags: ["music", "entertainment"]
    },
    {
      id: "sub-3",
      name: "Adobe Creative Cloud",
      description: "All apps plan",
      amount: 52.99,
      billingCycle: "monthly",
      nextBillingDate: new Date("2025-04-20"),
      category: "software",
      paymentMethod: "Visa *1234",
      active: true,
      logoUrl: "https://placehold.co/50x50?text=A",
      startDate: new Date("2023-11-20"),
      reminders: true,
      reminderDays: [7, 3],
      autoRenewal: true,
      tags: ["software", "work"]
    },
    {
      id: "sub-4",
      name: "Gym Membership",
      description: "Annual plan",
      amount: 600,
      billingCycle: "annual",
      nextBillingDate: new Date("2025-12-01"),
      category: "health",
      paymentMethod: "Bank Transfer",
      active: true,
      logoUrl: "https://placehold.co/50x50?text=G",
      startDate: new Date("2023-12-01"),
      reminders: true,
      reminderDays: [14, 7],
      autoRenewal: true,
      tags: ["fitness", "health"]
    },
    {
      id: "sub-5",
      name: "Disney+",
      description: "Basic plan",
      amount: 7.99,
      billingCycle: "monthly",
      nextBillingDate: new Date("2025-01-10"),
      category: "entertainment",
      paymentMethod: "Mastercard *5678",
      active: false,
      logoUrl: "https://placehold.co/50x50?text=D+",
      startDate: new Date("2023-07-10"),
      reminders: false,
      reminderDays: [],
      autoRenewal: false,
      tags: ["streaming", "entertainment"]
    },
  ];

  const activeSubscriptions = subscriptions.filter(sub => sub.active);
  const inactiveSubscriptions = subscriptions.filter(sub => !sub.active);

  const upcomingRenewals = subscriptions
    .filter(sub => sub.active && isBefore(sub.nextBillingDate, addDays(new Date(), 30)))
    .sort((a, b) => a.nextBillingDate.getTime() - b.nextBillingDate.getTime());

  const getNextBillingDate = (startDate: Date, cycle: BillingCycle): Date => {
    const now = new Date();
    let nextDate = new Date(startDate);

    while (isBefore(nextDate, now)) {
      switch (cycle) {
        case "weekly":
          nextDate = addDays(nextDate, 7);
          break;
        case "monthly":
          nextDate = addMonths(nextDate, 1);
          break;
        case "quarterly":
          nextDate = addMonths(nextDate, 3);
          break;
        case "annual":
          nextDate = addYears(nextDate, 1);
          break;
        case "custom":
          // Default to monthly for custom
          nextDate = addMonths(nextDate, 1);
          break;
      }
    }

    return nextDate;
  };

  const calculateTotalMonthly = (subs: Subscription[]): number => {
    return subs.reduce((total, sub) => {
      let monthlyAmount = sub.amount;
      switch (sub.billingCycle) {
        case "weekly":
          monthlyAmount = (sub.amount * 52) / 12;
          break;
        case "quarterly":
          monthlyAmount = sub.amount / 3;
          break;
        case "annual":
          monthlyAmount = sub.amount / 12;
          break;
      }
      return total + monthlyAmount;
    }, 0);
  };

  const totalMonthly = calculateTotalMonthly(activeSubscriptions);
  const totalAnnual = totalMonthly * 12;

  const handleUpdateField = (field: keyof Subscription, value: any) => {
    setNewSubscription({
      ...newSubscription,
      [field]: value
    });
  };

  const handleAddSubscription = () => {
    // In a real app, this would save to a database
    console.log("New subscription:", newSubscription);
    setOpenAddDialog(false);
    setNewSubscription({
      name: "",
      amount: 0,
      billingCycle: "monthly",
      nextBillingDate: new Date(),
      category: "entertainment",
      active: true,
      startDate: new Date(),
      reminders: true,
      reminderDays: [7],
      autoRenewal: true,
    });
  };

  const handleToggleReminders = (enabled: boolean) => {
    setNewSubscription({
      ...newSubscription,
      reminders: enabled,
      reminderDays: enabled ? [7] : []
    });
  };

  const categories = [
    { value: "entertainment", label: "Entertainment" },
    { value: "software", label: "Software & Services" },
    { value: "health", label: "Health & Fitness" },
    { value: "utilities", label: "Utilities" },
    { value: "news", label: "News & Media" },
    { value: "shopping", label: "Shopping" },
    { value: "education", label: "Education" },
    { value: "other", label: "Other" }
  ];

  const formatDate = (date: Date) => {
    return format(date, "MMM d, yyyy");
  };

  const getDaysUntil = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRenewalStatus = (sub: Subscription) => {
    const daysUntil = getDaysUntil(sub.nextBillingDate);

    if (daysUntil <= 3) {
      return <Badge variant="destructive">Renews soon</Badge>;
    } else if (daysUntil <= 7) {
      return <Badge variant="outline" className="text-amber-500 border-amber-500">Upcoming</Badge>;
    } else {
      return <Badge variant="outline">{daysUntil} days</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Manage Subscriptions
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Subscription Management</DialogTitle>
            <DialogDescription>
              Track and manage your recurring subscriptions and memberships
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 gap-2">
            <div>
              <p className="text-muted-foreground text-sm">Total Monthly: <span className="font-semibold text-foreground">${totalMonthly.toFixed(2)}</span></p>
              <p className="text-muted-foreground text-sm">Total Annual: <span className="font-semibold text-foreground">${totalAnnual.toFixed(2)}</span></p>
            </div>

            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subscription</DialogTitle>
                  <DialogDescription>
                    Enter the details of your recurring subscription
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Subscription Name</Label>
                    <Input
                      id="name"
                      value={newSubscription.name}
                      onChange={(e) => handleUpdateField("name", e.target.value)}
                      placeholder="e.g., Netflix, Spotify"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          className="pl-8"
                          value={newSubscription.amount || ''}
                          onChange={(e) => handleUpdateField("amount", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="billing-cycle">Billing Cycle</Label>
                      <Select
                        value={newSubscription.billingCycle}
                        onValueChange={(value: BillingCycle) => handleUpdateField("billingCycle", value)}
                      >
                        <SelectTrigger id="billing-cycle">
                          <SelectValue placeholder="Select billing cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            id="start-date"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !newSubscription.startDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newSubscription.startDate ? format(newSubscription.startDate, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newSubscription.startDate}
                            onSelect={(date) => date && handleUpdateField("startDate", date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={newSubscription.category}
                        onValueChange={(value) => handleUpdateField("category", value)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select
                      value={newSubscription.paymentMethod}
                      onValueChange={(value) => handleUpdateField("paymentMethod", value)}
                    >
                      <SelectTrigger id="payment-method">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa-1234">Visa *1234</SelectItem>
                        <SelectItem value="mc-5678">Mastercard *5678</SelectItem>
                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="reminders">Renewal Reminders</Label>
                        <p className="text-xs text-muted-foreground">Get notified before subscription renewals</p>
                      </div>
                      <Switch
                        id="reminders"
                        checked={newSubscription.reminders}
                        onCheckedChange={handleToggleReminders}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="auto-renewal">Auto Renewal</Label>
                        <p className="text-xs text-muted-foreground">Subscription automatically renews</p>
                      </div>
                      <Switch
                        id="auto-renewal"
                        checked={newSubscription.autoRenewal}
                        onCheckedChange={(checked) => handleUpdateField("autoRenewal", checked)}
                      />
                    </div>
                  </div>

                  {newSubscription.reminders && (
                    <div className="grid gap-2">
                      <Label>Reminder Days Before</Label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 3, 7, 14, 30].map((day) => (
                          <Badge
                            key={day}
                            variant={newSubscription.reminderDays?.includes(day) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const currentDays = newSubscription.reminderDays || [];
                              if (currentDays.includes(day)) {
                                handleUpdateField("reminderDays", currentDays.filter(d => d !== day));
                              } else {
                                handleUpdateField("reminderDays", [...currentDays, day].sort((a, b) => b - a));
                              }
                            }}
                          >
                            {day} {day === 1 ? 'day' : 'days'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenAddDialog(false)}>Cancel</Button>
                  <Button onClick={handleAddSubscription}>Add Subscription</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active ({activeSubscriptions.length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({inactiveSubscriptions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Next Renewal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subscription.logoUrl && (
                            <div className="h-8 w-8 rounded overflow-hidden">
                              <img src={subscription.logoUrl} alt={subscription.name} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{subscription.name}</div>
                            {subscription.description && (
                              <div className="text-xs text-muted-foreground">{subscription.description}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>${subscription.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{subscription.billingCycle}</TableCell>
                      <TableCell>{formatDate(subscription.nextBillingDate)}</TableCell>
                      <TableCell>{getRenewalStatus(subscription)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="inactive">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Billing Cycle</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subscription.logoUrl && (
                            <div className="h-8 w-8 rounded overflow-hidden">
                              <img src={subscription.logoUrl} alt={subscription.name} className="h-full w-full object-cover opacity-60" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-muted-foreground">{subscription.name}</div>
                            {subscription.description && (
                              <div className="text-xs text-muted-foreground">{subscription.description}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">${subscription.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">{subscription.billingCycle}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(subscription.nextBillingDate)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">Reactivate</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>

          {activeTab === "active" && upcomingRenewals.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Upcoming Renewals</h3>
              <div className="space-y-2">
                {upcomingRenewals.slice(0, 3).map((subscription) => (
                  <Card key={subscription.id} className="bg-muted/40">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <CalendarClock className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{subscription.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Renews on {formatDate(subscription.nextBillingDate)} ({getDaysUntil(subscription.nextBillingDate)} days)
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${subscription.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{subscription.billingCycle}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Optional: Preview of upcoming subscriptions to show outside the dialog */}
      {upcomingRenewals.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Upcoming Renewals</h3>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setOpen(true)}>
              View All
            </Button>
          </div>

          <Card>
            <CardContent className="p-3">
              <div className="space-y-3">
                {upcomingRenewals.slice(0, 2).map((subscription) => (
                  <div key={subscription.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {subscription.logoUrl && (
                        <div className="h-6 w-6 rounded overflow-hidden">
                          <img src={subscription.logoUrl} alt={subscription.name} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{subscription.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(subscription.nextBillingDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${subscription.amount.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{getDaysUntil(subscription.nextBillingDate)} days</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
