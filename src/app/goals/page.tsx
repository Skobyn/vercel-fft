"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoalVisualization } from "@/components/visualizations/goal-visualizations";
import { GoalForm } from "@/components/forms/goal-form";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";

interface Goal {
  id: string;
  name: string;
  saved: number;
  target: number;
  type: "adventure" | "envelope" | "balloon" | "jar";
  deadline: string;
  checkpoints?: Array<{
    amount: number;
    reward: string;
    achieved: boolean;
  }>;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      name: "Vacation Fund",
      saved: 2500,
      target: 5000,
      type: "adventure",
      deadline: "2024-12-31",
      checkpoints: [
        { amount: 1000, reward: "Book Flights", achieved: true },
        { amount: 2500, reward: "Reserve Hotel", achieved: true },
        { amount: 3500, reward: "Plan Activities", achieved: false },
        { amount: 5000, reward: "Spending Money", achieved: false },
      ]
    },
    {
      id: "2",
      name: "Emergency Fund",
      saved: 7500,
      target: 10000,
      type: "jar",
      deadline: "2024-06-30"
    },
    {
      id: "3",
      name: "New Car",
      saved: 15000,
      target: 20000,
      type: "balloon",
      deadline: "2025-01-31"
    },
    {
      id: "4",
      name: "Holiday Gifts",
      saved: 400,
      target: 1000,
      type: "envelope",
      deadline: "2024-12-01"
    }
  ]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleCreateGoal = (data: any) => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      name: data.name,
      saved: parseFloat(data.saved),
      target: parseFloat(data.target),
      type: data.type,
      deadline: data.deadline,
    };

    setGoals((prev) => [...prev, newGoal]);
    toast.success("Goal created successfully");
  };

  const handleEditGoal = (data: any) => {
    if (!editingGoal) return;

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === editingGoal.id
          ? {
              ...goal,
              name: data.name,
              saved: parseFloat(data.saved),
              target: parseFloat(data.target),
              type: data.type,
              deadline: data.deadline,
            }
          : goal
      )
    );

    setEditingGoal(null);
    toast.success("Goal updated successfully");
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
    toast.success("Goal deleted successfully");
  };

  const handleUpdateProgress = (id: string, amount: number) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              saved: Math.min(goal.target, goal.saved + amount),
            }
          : goal
      )
    );
    toast.success("Progress updated successfully");
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Savings Goals</h1>
            <p className="text-muted-foreground">
              Track and visualize your progress towards financial goals
            </p>
          </div>
          
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Goal
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Goals</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {goals.map((goal) => (
                <GoalVisualization
                  key={goal.id}
                  name={goal.name}
                  saved={goal.saved}
                  target={goal.target}
                  type={goal.type}
                  checkpoints={goal.checkpoints}
                  onEdit={() => {
                    setEditingGoal(goal);
                    setFormOpen(true);
                  }}
                  onDelete={() => handleDeleteGoal(goal.id)}
                  onUpdateProgress={(amount) => handleUpdateProgress(goal.id, amount)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {goals
                .filter(goal => goal.saved < goal.target)
                .map((goal) => (
                  <GoalVisualization
                    key={goal.id}
                    name={goal.name}
                    saved={goal.saved}
                    target={goal.target}
                    type={goal.type}
                    checkpoints={goal.checkpoints}
                    onEdit={() => {
                      setEditingGoal(goal);
                      setFormOpen(true);
                    }}
                    onDelete={() => handleDeleteGoal(goal.id)}
                    onUpdateProgress={(amount) => handleUpdateProgress(goal.id, amount)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {goals
                .filter(goal => goal.saved >= goal.target)
                .map((goal) => (
                  <GoalVisualization
                    key={goal.id}
                    name={goal.name}
                    saved={goal.saved}
                    target={goal.target}
                    type={goal.type}
                    checkpoints={goal.checkpoints}
                    onEdit={() => {
                      setEditingGoal(goal);
                      setFormOpen(true);
                    }}
                    onDelete={() => handleDeleteGoal(goal.id)}
                    onUpdateProgress={(amount) => handleUpdateProgress(goal.id, amount)}
                  />
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {goals.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Target className="h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="mt-4 text-lg font-semibold">No goals yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first savings goal to get started
              </p>
              <Button variant="link" className="mt-2" onClick={() => setFormOpen(true)}>
                Create a goal
              </Button>
            </CardContent>
          </Card>
        )}

        <GoalForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={editingGoal ? handleEditGoal : handleCreateGoal}
          initialData={editingGoal ? {
            ...editingGoal,
            saved: editingGoal.saved.toString(),
            target: editingGoal.target.toString(),
          } : undefined}
        />
      </div>
    </MainLayout>
  );
}
