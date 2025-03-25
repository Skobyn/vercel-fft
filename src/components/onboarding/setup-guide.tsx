"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Wallet,
  CalendarClock,
  PiggyBank,
  Target,
  TrendingUp,
  BarChart3,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useFinancialProfile } from "@/hooks/use-financial-data";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface SetupGuideProps {
  onClose?: () => void;
  onSetBalance?: (amount: number) => void;
}

export function SetupGuide({ onClose, onSetBalance }: SetupGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState<string>("");
  const router = useRouter();
  const { profile, updateBalance } = useFinancialProfile();

  // Load completed steps from localStorage
  useEffect(() => {
    const savedSteps = localStorage.getItem("setup_completed_steps");
    if (savedSteps) {
      setCompletedSteps(JSON.parse(savedSteps));
    }
  }, []);

  // Save completed steps to localStorage
  const markStepComplete = (stepId: string) => {
    const updatedSteps = { ...completedSteps, [stepId]: true };
    setCompletedSteps(updatedSteps);
    localStorage.setItem("setup_completed_steps", JSON.stringify(updatedSteps));
  };

  // Handle balance update
  const handleBalanceUpdate = async () => {
    const amount = parseFloat(balanceAmount);
    
    if (isNaN(amount)) {
      toast.error("Please enter a valid number");
      return;
    }
    
    try {
      if (onSetBalance) {
        onSetBalance(amount);
      } else {
        await updateBalance(amount, "Initial setup");
        toast.success("Balance updated successfully");
      }
      
      setBalanceDialogOpen(false);
      markStepComplete("current-balance");
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error("Failed to update balance");
    }
  };

  // Calculate progress
  const totalSteps = 5; // Number of setup steps
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progress = (completedCount / totalSteps) * 100;

  const steps = [
    {
      id: "current-balance",
      title: "Set Your Current Balance",
      description: "Update your current account balance to start tracking accurately.",
      icon: <Wallet className="h-5 w-5" />,
      action: () => setBalanceDialogOpen(true),
    },
    {
      id: "income",
      title: "Add Your Income Sources",
      description: "Set up your regular income to forecast your cash flow.",
      icon: <TrendingUp className="h-5 w-5" />,
      action: () => router.push("/income"),
    },
    {
      id: "bills",
      title: "Add Your Bills & Expenses",
      description: "Track recurring bills and expenses to manage your monthly spending.",
      icon: <CalendarClock className="h-5 w-5" />,
      action: () => router.push("/bills/expenses"),
    },
    {
      id: "budgets",
      title: "Create a Budget",
      description: "Set spending limits for different categories to stay on track.",
      icon: <PiggyBank className="h-5 w-5" />,
      action: () => router.push("/budgets"),
    },
    {
      id: "goals",
      title: "Set Financial Goals",
      description: "Define your financial goals to track your progress over time.",
      icon: <Target className="h-5 w-5" />,
      action: () => router.push("/goals"),
    },
  ];

  return (
    <>
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Quick Start Guide</CardTitle>
              <CardDescription>
                Follow these steps to set up your financial profile
              </CardDescription>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              {completedCount} of {totalSteps} steps completed
            </Badge>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {steps.map((step, index) => (
              <AccordionItem key={step.id} value={step.id}>
                <AccordionTrigger className="py-4">
                  <div className="flex items-center text-left">
                    <div className="mr-4 flex-shrink-0">
                      {completedSteps[step.id] ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <div className="rounded-full bg-muted w-6 h-6 flex items-center justify-center">
                          <span className="text-xs font-medium">{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{step.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4 pl-14">
                  <div className="flex flex-col space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {step.id === "current-balance" && (
                        <>Set your current account balance to get an accurate picture of your finances.</>
                      )}
                      {step.id === "income" && (
                        <>Add your income sources such as salary, freelance work, or other regular income.</>
                      )}
                      {step.id === "bills" && (
                        <>Track your recurring bills like rent, utilities, and subscriptions.</>
                      )}
                      {step.id === "budgets" && (
                        <>Set up budget categories to control your spending and save more.</>
                      )}
                      {step.id === "goals" && (
                        <>Define financial goals like emergency fund, vacation, or down payment.</>
                      )}
                    </p>
                    <div className="flex justify-between items-center">
                      <Button
                        onClick={() => {
                          step.action();
                          if (step.id !== "current-balance" && !completedSteps[step.id]) {
                            markStepComplete(step.id);
                          }
                        }}
                      >
                        {completedSteps[step.id] ? "Review" : "Get Started"}
                      </Button>
                      {!completedSteps[step.id] && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markStepComplete(step.id)}
                        >
                          Skip this step
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between">
          <p className="text-sm text-muted-foreground">
            You can access this guide anytime from your dashboard
          </p>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close Guide
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Balance Update Dialog */}
      <Dialog open={balanceDialogOpen} onOpenChange={setBalanceDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set Your Current Balance</DialogTitle>
            <DialogDescription>
              Enter your current total balance across all accounts to start tracking your finances accurately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Balance
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                <Input
                  id="balance"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBalanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBalanceUpdate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 