"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalVisualization } from "@/components/visualizations/goal-visualizations";
import { GoalForm } from "@/components/forms/goal-form";
import { Plus, Home, Plane, Car, Briefcase, GraduationCap, Heart } from "lucide-react";
import { toast } from "sonner";

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

// Sample data - replace with real data from API
const mockGoals = [
  {
    id: "1",
    name: "Home Down Payment",
    category: "Housing",
    saved: 15000,
    target: 40000,
    icon: <Home className="w-4 h-4" />,
    checkpoints: [
      { amount: 10000, label: "10%" },
      { amount: 20000, label: "50%" },
      { amount: 30000, label: "75%" }
    ]
  },
  {
    id: "2",
    name: "Vacation",
    category: "Travel",
    saved: 3850,
    target: 5000,
    icon: <Plane className="w-4 h-4" />,
    checkpoints: [
      { amount: 2500, label: "50%" },
      { amount: 3750, label: "75%" }
    ]
  },
  {
    id: "3",
    name: "Car",
    category: "Transportation",
    saved: 12000,
    target: 25000,
    icon: <Car className="w-4 h-4" />,
    checkpoints: [
      { amount: 6250, label: "25%" },
      { amount: 12500, label: "50%" },
      { amount: 18750, label: "75%" }
    ]
  },
  {
    id: "4",
    name: "Emergency Fund",
    category: "Financial Security",
    saved: 6000,
    target: 6000,
    icon: <Heart className="w-4 h-4" />,
    checkpoints: [
      { amount: 1500, label: "25%" },
      { amount: 3000, label: "50%" },
      { amount: 4500, label: "75%" }
    ]
  },
  {
    id: "5",
    name: "Education",
    category: "Personal Development",
    saved: 2500,
    target: 10000,
    icon: <GraduationCap className="w-4 h-4" />,
    checkpoints: [
      { amount: 2500, label: "25%" },
      { amount: 5000, label: "50%" },
      { amount: 7500, label: "75%" }
    ]
  },
  {
    id: "6",
    name: "Business Startup",
    category: "Career",
    saved: 7000,
    target: 20000,
    icon: <Briefcase className="w-4 h-4" />,
    checkpoints: [
      { amount: 5000, label: "25%" },
      { amount: 10000, label: "50%" },
      { amount: 15000, label: "75%" }
    ]
  }
];

export default function GoalsPage() {
  // Using our mock data for now, replace with API call later
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [visualizationType, setVisualizationType] = useState<"adventure" | "jar" | "envelope" | "balloon">("jar");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const handleCreateGoal = (data: any) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      name: data.name,
      category: data.category,
      saved: parseFloat(data.saved) || 0,
      target: parseFloat(data.target),
      type: data.type,
      checkpoints: data.checkpoints || []
    };
    
    setGoals([...goals, newGoal]);
    setFormOpen(false);
    toast.success("Goal created successfully");
  };

  const handleUpdateGoal = (data: any) => {
    if (!editingGoal) return;
    
    const updatedGoals = goals.map(goal => 
      goal.id === editingGoal.id ? {
        ...goal,
        name: data.name,
        category: data.category,
        saved: parseFloat(data.saved) || 0,
        target: parseFloat(data.target),
        type: data.type,
        checkpoints: data.checkpoints || []
      } : goal
    );
    
    setGoals(updatedGoals);
    setFormOpen(false);
    setEditingGoal(null);
    toast.success("Goal updated successfully");
  };

  const handleDeleteGoal = (id: string) => {
    setGoals(goals.filter(goal => goal.id !== id));
    toast.success("Goal deleted successfully");
  };

  const handleUpdateProgress = (id: string, amount: number) => {
    const updatedGoals = goals.map(goal => 
      goal.id === id ? {
        ...goal,
        saved: Math.min(goal.target, Math.max(0, goal.saved + amount))
      } : goal
    );
    
    setGoals(updatedGoals);
    toast.success("Progress updated successfully");
  };

  // Filter goals based on completion status
  const filteredGoals = goals.filter(goal => {
    if (filter === "all") return true;
    if (filter === "active") return goal.saved < goal.target;
    if (filter === "completed") return goal.saved >= goal.target;
    return true;
  });

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
                icon={goal.icon}
                checkpoints={goal.checkpoints}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {goals.length === 0 && (
        <div className="text-center p-8">
          <p className="text-muted-foreground mb-4">You haven't set any savings goals yet</p>
          <Button onClick={() => setFormOpen(true)}>Create Your First Goal</Button>
        </div>
      )}
    </MainLayout>
  );
}
