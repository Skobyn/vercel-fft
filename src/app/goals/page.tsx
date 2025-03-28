"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalVisualization } from "@/components/visualizations/goal-visualizations";
import { GoalForm } from "@/components/forms/goal-form";
import { Plus, Home, Plane, Car, Briefcase, GraduationCap, Heart, ArrowRight, Info, Target } from "lucide-react";
import { toast } from "sonner";
import { useGoals } from "@/hooks/use-financial-data";
import { GOAL_CATEGORIES } from "@/types/financial";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/providers/firebase-auth-provider";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Goal {
  id: string;
  name: string;
  category?: string;
  saved: number;
  target: number;
  type?: "adventure" | "jar" | "envelope" | "balloon";
  checkpoints?: Array<{
    amount: number;
    label: string;
  }>;
  icon?: React.ReactNode;
}

// Helper function to get icon for goal category
const getCategoryIcon = (category?: string) => {
  switch (category?.toLowerCase()) {
    case 'housing':
      return <Home className="w-4 h-4" />;
    case 'travel':
      return <Plane className="w-4 h-4" />;
    case 'transportation':
      return <Car className="w-4 h-4" />;
    case 'financial security':
      return <Heart className="w-4 h-4" />;
    case 'personal development':
      return <GraduationCap className="w-4 h-4" />;
    case 'career':
      return <Briefcase className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
};

// Suggested goals for guided setup
const suggestedGoals = [
  {
    name: "Emergency Fund",
    category: "Financial Security",
    target: 5000,
    description: "3-6 months of expenses for unexpected emergencies"
  },
  {
    name: "Home Down Payment",
    category: "Housing",
    target: 20000,
    description: "Save for a down payment on a home purchase"
  },
  {
    name: "Vacation",
    category: "Travel",
    target: 3000,
    description: "Fund your next vacation or trip"
  },
  {
    name: "New Car",
    category: "Transportation",
    target: 10000,
    description: "Save for a new vehicle or major car expense"
  },
  {
    name: "Education Fund",
    category: "Personal Development",
    target: 7500,
    description: "Save for tuition, courses, or skill development"
  }
];

export default function GoalsPage() {
  const { user } = useAuth();
  const { goals, loading, addGoal, updateGoal, deleteGoal } = useGoals();
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [visualizationType, setVisualizationType] = useState<"adventure" | "jar" | "envelope" | "balloon">("jar");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [showGuidedSetup, setShowGuidedSetup] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [customGoalAmount, setCustomGoalAmount] = useState("");
  const [customGoalName, setCustomGoalName] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<any>(null);

  useEffect(() => {
    // Show guided setup if there are no goals
    if (!loading && goals.length === 0) {
      setShowGuidedSetup(true);
    }
  }, [loading, goals]);

  const handleCreateGoal = async (data: any) => {
    try {
      await addGoal({
        name: data.name,
        category: data.category,
        saved: parseFloat(data.saved) || 0,
        target: parseFloat(data.target),
        type: data.type || "jar",
        checkpoints: data.checkpoints || [],
        targetDate: data.targetDate
      });
      
      setFormOpen(false);
      toast.success("Goal created successfully");
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  const handleUpdateGoal = async (data: any) => {
    if (!editingGoal) return;
    
    try {
      await updateGoal({
        id: editingGoal.id,
        name: data.name,
        category: data.category,
        saved: parseFloat(data.saved) || 0,
        target: parseFloat(data.target),
        type: data.type || "jar",
        checkpoints: data.checkpoints || []
      });
      
      setFormOpen(false);
      setEditingGoal(null);
      toast.success("Goal updated successfully");
    } catch (error) {
      toast.error("Failed to update goal");
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      toast.success("Goal deleted successfully");
    } catch (error) {
      toast.error("Failed to delete goal");
    }
  };

  const handleUpdateProgress = async (id: string, amount: number) => {
    try {
      const goal = goals.find(g => g.id === id);
      if (!goal) return;
      
      await updateGoal({
        id,
        saved: Math.min(goal.target, Math.max(0, goal.saved + amount))
      });
      
      toast.success("Progress updated successfully");
    } catch (error) {
      toast.error("Failed to update progress");
    }
  };

  const handleCreateSuggestedGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      await addGoal({
        name: selectedGoal.name,
        category: selectedGoal.category,
        saved: 0,
        target: selectedGoal.target,
        type: "jar"
      });
      
      setSelectedGoal(null);
      setSetupStep(1);
      setShowGuidedSetup(false);
      toast.success(`Added "${selectedGoal.name}" goal`);
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  const handleCreateCustomGoal = async () => {
    if (!customGoalName || !customGoalAmount) {
      toast.error("Please enter a name and target amount");
      return;
    }
    
    try {
      await addGoal({
        name: customGoalName,
        category: "Other",
        saved: 0,
        target: parseFloat(customGoalAmount),
        type: "jar"
      });
      
      setCustomGoalName("");
      setCustomGoalAmount("");
      setSetupStep(1);
      setShowGuidedSetup(false);
      toast.success(`Added "${customGoalName}" goal`);
    } catch (error) {
      toast.error("Failed to create goal");
    }
  };

  // Filter goals based on completion status
  const filteredGoals = goals.filter(goal => {
    if (filter === "all") return true;
    if (filter === "active") return goal.saved < goal.target;
    if (filter === "completed") return goal.saved >= goal.target;
    return true;
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your goals...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Savings Goals</h1>
        <Button onClick={() => {
          setEditingGoal(null);
          setFormOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {formOpen && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <GoalForm 
              onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
              onCancel={() => {
                setFormOpen(false);
                setEditingGoal(null);
              }}
              initialData={editingGoal ? {
                name: editingGoal.name,
                category: editingGoal.category,
                saved: editingGoal.saved.toString(),
                target: editingGoal.target.toString(),
                type: editingGoal.type as "adventure" | "jar" | "envelope" | "balloon"
              } : undefined}
            />
          </CardContent>
        </Card>
      )}

      {showGuidedSetup ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Get Started with Your First Goal</CardTitle>
            <CardDescription>
              Set up your first savings goal to start tracking your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {setupStep === 1 ? (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <Target className="h-12 w-12 mx-auto text-primary mb-2" />
                  <h3 className="text-lg font-medium">Choose a Goal Type</h3>
                  <p className="text-muted-foreground">
                    Select a pre-defined goal or create your own custom goal
                  </p>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSetupStep(2)}>
                    <CardHeader>
                      <CardTitle className="text-md">Choose a Suggested Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Select from popular financial goals with recommended targets
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        View Suggestions
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSetupStep(3)}>
                    <CardHeader>
                      <CardTitle className="text-md">Create a Custom Goal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Define your own personalized savings goal
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full">
                        Create Custom Goal
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            ) : setupStep === 2 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Suggested Goals</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSetupStep(1)}>
                    Back
                  </Button>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestedGoals.map((goal, index) => (
                    <Card 
                      key={index} 
                      className={`cursor-pointer transition-colors ${selectedGoal?.name === goal.name ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                      onClick={() => setSelectedGoal(goal)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md">{goal.name}</CardTitle>
                          {getCategoryIcon(goal.category)}
                        </div>
                        <CardDescription>{goal.category}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="font-medium">${goal.target.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setSetupStep(1)}>
                    Back
                  </Button>
                  <Button 
                    disabled={!selectedGoal}
                    onClick={handleCreateSuggestedGoal}
                  >
                    Create Goal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Create a Custom Goal</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSetupStep(1)}>
                    Back
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="goalName">Goal Name</Label>
                    <Input 
                      id="goalName"
                      placeholder="e.g., New Laptop, Wedding Fund"
                      value={customGoalName}
                      onChange={(e) => setCustomGoalName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="goalAmount">Target Amount ($)</Label>
                    <Input 
                      id="goalAmount"
                      placeholder="1000"
                      type="number"
                      min="1"
                      step="0.01"
                      value={customGoalAmount}
                      onChange={(e) => setCustomGoalAmount(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => setSetupStep(1)}>
                    Back
                  </Button>
                  <Button 
                    disabled={!customGoalName || !customGoalAmount || parseFloat(customGoalAmount) <= 0}
                    onClick={handleCreateCustomGoal}
                  >
                    Create Goal
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : goals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>
              Visualize your savings journey with engaging animated graphics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Goals</TabsTrigger>
                  <TabsTrigger value="active">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="mb-4">
              <Tabs defaultValue="jar" onValueChange={(value) => setVisualizationType(value as any)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="jar">Money Jar</TabsTrigger>
                  <TabsTrigger value="adventure">Adventure Map</TabsTrigger>
                  <TabsTrigger value="envelope">Cash Envelope</TabsTrigger>
                  <TabsTrigger value="balloon">Balloon</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGoals.map((goal) => (
                <GoalVisualization
                  key={goal.id}
                  name={goal.name}
                  category={goal.category}
                  saved={goal.saved}
                  target={goal.target}
                  type={visualizationType}
                  icon={getCategoryIcon(goal.category)}
                  checkpoints={goal.checkpoints}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center p-8">
          <p className="text-muted-foreground mb-4">You haven't set any savings goals yet</p>
          <Button onClick={() => setShowGuidedSetup(true)}>Create Your First Goal</Button>
        </div>
      )}
    </MainLayout>
  );
}
