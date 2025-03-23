"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Goal = {
  id: number;
  name: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
  recurringContribution: number;
  contributionFrequency: "weekly" | "biweekly" | "monthly";
  isCompleted: boolean;
  icon: string;
};

export default function GoalsPage() {
  const [openNewGoalDialog, setOpenNewGoalDialog] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalInitial, setGoalInitial] = useState("");
  const [goalDeadline, setGoalDeadline] = useState<Date | undefined>();
  const [goalCategory, setGoalCategory] = useState("");
  const [recurringContribution, setRecurringContribution] = useState("");
  const [contributionFrequency, setContributionFrequency] = useState<Goal["contributionFrequency"]>("monthly");
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Sample predefined categories
  const categories = [
    { value: "vacation", label: "Vacation" },
    { value: "home", label: "Home Purchase" },
    { value: "car", label: "Car" },
    { value: "education", label: "Education" },
    { value: "emergency", label: "Emergency Fund" },
    { value: "retirement", label: "Retirement" },
    { value: "wedding", label: "Wedding" },
    { value: "other", label: "Other" },
  ];

  // Sample goals data
  const goals: Goal[] = [
    {
      id: 1,
      name: "Vacation to Hawaii",
      target: 3000,
      current: 1500,
      deadline: "2025-08-15",
      category: "Vacation",
      recurringContribution: 200,
      contributionFrequency: "monthly",
      isCompleted: false,
      icon: "🏝️",
    },
    {
      id: 2,
      name: "New Car",
      target: 15000,
      current: 4500,
      deadline: "2026-01-30",
      category: "Car",
      recurringContribution: 500,
      contributionFrequency: "monthly",
      isCompleted: false,
      icon: "🚗",
    },
    {
      id: 3,
      name: "Emergency Fund",
      target: 10000,
      current: 8200,
      deadline: "2025-06-15",
      category: "Emergency Fund",
      recurringContribution: 300,
      contributionFrequency: "biweekly",
      isCompleted: false,
      icon: "🏦",
    },
    {
      id: 4,
      name: "Home Down Payment",
      target: 50000,
      current: 12500,
      deadline: "2026-12-31",
      category: "Home Purchase",
      recurringContribution: 750,
      contributionFrequency: "monthly",
      isCompleted: false,
      icon: "🏠",
    },
    {
      id: 5,
      name: "Anniversary Trip",
      target: 2000,
      current: 2000,
      deadline: "2025-02-15",
      category: "Vacation",
      recurringContribution: 0,
      contributionFrequency: "monthly",
      isCompleted: true,
      icon: "✈️",
    },
  ];

  // Filter goals based on search and category
  const filteredGoals = goals.filter(goal => {
    const matchesSearch = searchText === "" ||
      goal.name.toLowerCase().includes(searchText.toLowerCase()) ||
      goal.category.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = selectedCategory === null || goal.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Separate goals by status
  const activeGoals = filteredGoals.filter(goal => !goal.isCompleted);
  const completedGoals = filteredGoals.filter(goal => goal.isCompleted);

  // Calculate days left until goal deadline
  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate projected completion based on contributions
  const getProjectedCompletion = (goal: Goal) => {
    const remaining = goal.target - goal.current;

    let contributionPerMonth = 0;
    switch (goal.contributionFrequency) {
      case "weekly":
        contributionPerMonth = goal.recurringContribution * 4.333; // Average weeks in a month
        break;
      case "biweekly":
        contributionPerMonth = goal.recurringContribution * 2.166; // Average bi-weeks in a month
        break;
      case "monthly":
        contributionPerMonth = goal.recurringContribution;
        break;
    }

    if (contributionPerMonth <= 0) return "No projected date";

    const monthsNeeded = Math.ceil(remaining / contributionPerMonth);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsNeeded);

    return format(projectedDate, "MMM yyyy");
  };

  // Function to handle adding a new goal
  const handleAddGoal = () => {
    // In a real app, this would add the goal to the database
    console.log("Adding new goal:", {
      name: goalName,
      target: parseFloat(goalTarget),
      initial: parseFloat(goalInitial),
      deadline: goalDeadline,
      category: goalCategory,
      recurringContribution: parseFloat(recurringContribution),
      contributionFrequency: contributionFrequency,
    });

    // Reset form
    setGoalName("");
    setGoalTarget("");
    setGoalInitial("");
    setGoalDeadline(undefined);
    setGoalCategory("");
    setRecurringContribution("");
    setContributionFrequency("monthly");

    // Close dialog
    setOpenNewGoalDialog(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
            <p className="text-muted-foreground">
              Track your progress towards financial milestones
            </p>
          </div>
          <Dialog open={openNewGoalDialog} onOpenChange={setOpenNewGoalDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Savings Goal</DialogTitle>
                <DialogDescription>
                  Set a new financial goal and track your progress.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="goalName">Goal Name</Label>
                  <Input
                    id="goalName"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g. Vacation Fund"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goalTarget">Target Amount</Label>
                  <Input
                    id="goalTarget"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goalInitial">Initial Amount</Label>
                  <Input
                    id="goalInitial"
                    value={goalInitial}
                    onChange={(e) => setGoalInitial(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Target Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !goalDeadline && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {goalDeadline ? format(goalDeadline, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={goalDeadline}
                        onSelect={setGoalDeadline}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goalCategory">Category</Label>
                  <Select value={goalCategory} onValueChange={setGoalCategory}>
                    <SelectTrigger id="goalCategory">
                      <SelectValue placeholder="Select Category" />
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
                <div className="grid gap-2">
                  <Label htmlFor="recurringContribution">Recurring Contribution</Label>
                  <Input
                    id="recurringContribution"
                    value={recurringContribution}
                    onChange={(e) => setRecurringContribution(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contributionFrequency">Contribution Frequency</Label>
                  <Select
                    value={contributionFrequency}
                    onValueChange={(value: "weekly" | "biweekly" | "monthly") => setContributionFrequency(value)}
                  >
                    <SelectTrigger id="contributionFrequency">
                      <SelectValue placeholder="Select Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenNewGoalDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGoal}>
                  Create Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
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
                {Array.from(new Set(goals.map(goal => goal.category))).map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active Goals ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {activeGoals.length > 0 ? (
                activeGoals.map((goal) => (
                  <Card key={goal.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span role="img" aria-label={goal.category} className="text-2xl">
                            {goal.icon}
                          </span>
                          <CardTitle>{goal.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {goal.category} • Due {new Date(goal.deadline).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            ${goal.current.toFixed(2)} of ${goal.target.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${(goal.current / goal.target) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {Math.round((goal.current / goal.target) * 100)}% complete
                          </span>
                          <span className="font-medium">
                            ${(goal.target - goal.current).toFixed(2)} remaining
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg border p-2">
                          <div className="text-muted-foreground">Time Left</div>
                          <div className="text-lg font-semibold">{getDaysLeft(goal.deadline)} days</div>
                        </div>
                        <div className="rounded-lg border p-2">
                          <div className="text-muted-foreground">Monthly Contribution</div>
                          <div className="text-lg font-semibold">${goal.recurringContribution.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {goal.recurringContribution > 0 ? (
                          <>
                            Contributing ${goal.recurringContribution.toFixed(2)} {goal.contributionFrequency}.
                            Projected completion: {getProjectedCompletion(goal)}
                          </>
                        ) : (
                          <>No recurring contributions set.</>
                        )}
                      </div>

                      <Button className="w-full">Add Contribution</Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">
                    No active goals found. Create a new goal to get started!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {completedGoals.length > 0 ? (
                completedGoals.map((goal) => (
                  <Card key={goal.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span role="img" aria-label={goal.category} className="text-2xl">
                            {goal.icon}
                          </span>
                          <CardTitle>{goal.name}</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription>
                        {goal.category} • Completed {new Date(goal.deadline).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Final Amount</span>
                          <span className="font-medium">
                            ${goal.target.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: "100%" }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            100% complete
                          </span>
                          <span className="font-medium text-green-600">
                            Goal achieved!
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-muted-foreground">
                    No completed goals found. Keep working towards your active goals!
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
