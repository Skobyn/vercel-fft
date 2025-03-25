"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/providers/firebase-auth-provider';
import { Calendar, Plus, TrendingUp, DollarSign, Rocket, Target, Edit, Trash } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function GoalsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  
  // Form state for new goal
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCategory, setGoalCategory] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  // Goal categories
  const goalCategories = [
    { value: 'emergency', label: 'Emergency Fund', icon: '🚨' },
    { value: 'retirement', label: 'Retirement', icon: '👴' },
    { value: 'house', label: 'House Down Payment', icon: '🏠' },
    { value: 'car', label: 'Car', icon: '🚗' },
    { value: 'vacation', label: 'Vacation', icon: '✈️' },
    { value: 'education', label: 'Education', icon: '📚' },
    { value: 'debt', label: 'Debt Payoff', icon: '💳' },
    { value: 'other', label: 'Other', icon: '📌' },
  ];

  // Load goals on component mount
  useEffect(() => {
    // This would fetch goals from a service in a real app
    // For now, just simulate loading
    if (user) {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [user]);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [authLoading, user, router]);

  // Handle adding a new goal
  const handleAddGoal = () => {
    // Validate inputs
    if (!goalName || !goalAmount || !goalTarget || !goalCategory || !goalDeadline) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(goalAmount);
    const target = parseFloat(goalTarget);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid current amount');
      return;
    }
    
    if (isNaN(target) || target <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }

    if (amount >= target) {
      toast.error('Current amount must be less than target amount');
      return;
    }

    // Create new goal object
    const newGoal = {
      id: Date.now().toString(),
      name: goalName,
      currentAmount: amount,
      targetAmount: target,
      category: goalCategory,
      deadline: goalDeadline,
      createdAt: new Date().toISOString(),
      categoryInfo: goalCategories.find(cat => cat.value === goalCategory),
    };

    // Add to state
    setGoals(prev => [...prev, newGoal]);
    
    // Reset form
    setGoalName('');
    setGoalAmount('');
    setGoalTarget('');
    setGoalCategory('');
    setGoalDeadline('');
    
    // Close dialog
    setNewGoalOpen(false);
    
    // Hide setup guide if showing
    setShowSetupGuide(false);
    
    toast.success('Goal added successfully');
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
            <p className="text-muted-foreground">
              Set and track progress towards your financial goals
            </p>
          </div>
          <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Financial Goal</DialogTitle>
                <DialogDescription>
                  Define your goal and track your progress towards achieving it.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="goalName">Goal Name</Label>
                  <Input
                    id="goalName"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="e.g. Emergency Fund"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="currentAmount">Current Amount</Label>
                    <Input
                      id="currentAmount"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="targetAmount">Target Amount</Label>
                    <Input
                      id="targetAmount"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={goalCategory} onValueChange={setGoalCategory}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.icon} {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deadline">Target Date</Label>
                  <Input
                    id="deadline"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                    type="date"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewGoalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGoal}>Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Goals Setup Guide */}
        {showSetupGuide && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <Target className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Set Your Financial Goals</CardTitle>
                  <CardDescription className="text-blue-700">
                    Start tracking your progress towards your financial dreams
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <h3 className="font-medium text-blue-800">Why set financial goals?</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Setting clear goals helps you stay motivated, make better financial decisions, 
                    and track your progress toward important life milestones.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-blue-200 bg-blue-100/50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-1">Step 1</h4>
                    <p className="text-sm text-blue-700">Define your short and long-term financial goals</p>
                  </div>
                  <div className="border border-blue-200 bg-blue-100/50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-1">Step 2</h4>
                    <p className="text-sm text-blue-700">Set specific target amounts and deadlines</p>
                  </div>
                  <div className="border border-blue-200 bg-blue-100/50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-1">Step 3</h4>
                    <p className="text-sm text-blue-700">Track your progress and celebrate milestones</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setNewGoalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Goal
              </Button>
              <Button variant="ghost" className="ml-2" onClick={() => setShowSetupGuide(false)}>
                Dismiss
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Show when no goals exist and guide is dismissed */}
        {goals.length === 0 && !showSetupGuide && (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <Rocket className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No financial goals yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Start by creating your first financial goal to track your progress towards your dreams.
            </p>
            <Button onClick={() => setNewGoalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Goal
            </Button>
          </Card>
        )}

        {/* Goals Grid */}
        {goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
              const deadlineDate = new Date(goal.deadline);
              const today = new Date();
              const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
              
              return (
                <Card key={goal.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                          {goal.categoryInfo.icon}
                        </div>
                        <div>
                          <CardTitle className="text-base">{goal.name}</CardTitle>
                          <CardDescription>{goal.categoryInfo.label}</CardDescription>
                        </div>
                      </div>
                      <div className="flex">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mt-2 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="font-medium">${goal.currentAmount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target: </span>
                          <span className="font-medium">${goal.targetAmount.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Deadline: </span>
                        <span>
                          {new Date(goal.deadline).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {daysLeft > 0 ? (
                          <Badge variant="outline" className="ml-1 px-1 py-0 h-4">
                            {daysLeft} days left
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="ml-1 px-1 py-0 h-4">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 py-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs w-full">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Add Contribution
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
