import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/firebase-auth-provider';
import {
  Income, Bill, Expense, Budget, Goal, FinancialProfile
} from '@/types/financial';
import * as FinancialService from '@/services/financial-service';
import { toast } from 'sonner';

// Helper to ensure user data is properly initialized
const ensureUserDataInitialized = async (userId: string) => {
  try {
    // Check if profile exists, create if not
    const profile = await FinancialService.getFinancialProfile(userId);
    
    // Can add more initialization checks here if needed
    return true;
  } catch (error) {
    console.error('Error initializing user data:', error);
    return false;
  }
};

export function useFinancialProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First ensure data is initialized
      await ensureUserDataInitialized(user.uid);
      
      const data = await FinancialService.getFinancialProfile(user.uid);
      setProfile(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching financial profile:', err);
      setError(err);
      toast.error('Failed to load financial profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateBalance = useCallback(async (newBalance: number, reason: string) => {
    if (!user || !profile) {
      toast.error('You must be logged in to update your balance');
      return;
    }

    try {
      const updatedProfile = await FinancialService.updateBalance(user.uid, newBalance, reason);
      setProfile(updatedProfile);
      toast.success('Balance updated successfully');
      return updatedProfile;
    } catch (err: any) {
      console.error('Error updating balance:', err);
      toast.error(err.message || 'Failed to update balance');
      throw err;
    }
  }, [user, profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateBalance,
    refetch: fetchProfile
  };
}

export function useIncomes() {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchIncomes = useCallback(async () => {
    if (!user) {
      setIncomes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await FinancialService.getIncomes(user.uid);
      setIncomes(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching incomes:', err);
      setError(err);
      toast.error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addIncome = useCallback(async (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('You must be logged in to add income');
      return;
    }

    try {
      const newIncome = await FinancialService.addIncome(income, user.uid);
      setIncomes(prev => [newIncome, ...prev]);
      toast.success('Income added successfully');
      return newIncome;
    } catch (err: any) {
      console.error('Error adding income:', err);
      toast.error(err.message || 'Failed to add income');
      throw err;
    }
  }, [user]);

  const updateIncome = useCallback(async (income: Partial<Income> & { id: string }) => {
    if (!user) {
      toast.error('You must be logged in to update income');
      return;
    }

    try {
      await FinancialService.updateIncome(income, user.uid);
      setIncomes(prev => prev.map(item => 
        item.id === income.id ? { ...item, ...income, updatedAt: new Date().toISOString() } : item
      ));
      toast.success('Income updated successfully');
    } catch (err: any) {
      console.error('Error updating income:', err);
      toast.error(err.message || 'Failed to update income');
      throw err;
    }
  }, [user]);

  const deleteIncome = useCallback(async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete income');
      return;
    }

    try {
      await FinancialService.deleteIncome(id, user.uid);
      setIncomes(prev => prev.filter(item => item.id !== id));
      toast.success('Income deleted successfully');
    } catch (err: any) {
      console.error('Error deleting income:', err);
      toast.error(err.message || 'Failed to delete income');
      throw err;
    }
  }, [user]);

  useEffect(() => {
    fetchIncomes();
  }, [fetchIncomes]);

  return {
    incomes,
    loading,
    error,
    addIncome,
    updateIncome,
    deleteIncome,
    refetch: fetchIncomes
  };
}

export function useBills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBills = useCallback(async () => {
    if (!user) {
      setBills([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await FinancialService.getBills(user.uid);
      setBills(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching bills:', err);
      setError(err);
      toast.error('Failed to load bill data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addBill = useCallback(async (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('You must be logged in to add a bill');
      return;
    }

    try {
      const newBill = await FinancialService.addBill(bill, user.uid);
      setBills(prev => [newBill, ...prev].sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ));
      toast.success('Bill added successfully');
      return newBill;
    } catch (err: any) {
      console.error('Error adding bill:', err);
      toast.error(err.message || 'Failed to add bill');
      throw err;
    }
  }, [user]);

  const updateBill = useCallback(async (bill: Partial<Bill> & { id: string }) => {
    if (!user) {
      toast.error('You must be logged in to update a bill');
      return;
    }

    try {
      await FinancialService.updateBill(bill, user.uid);
      setBills(prev => prev.map(item => 
        item.id === bill.id ? { ...item, ...bill, updatedAt: new Date().toISOString() } : item
      ).sort((a, b) => 
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ));
      toast.success('Bill updated successfully');
    } catch (err: any) {
      console.error('Error updating bill:', err);
      toast.error(err.message || 'Failed to update bill');
      throw err;
    }
  }, [user]);

  const deleteBill = useCallback(async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a bill');
      return;
    }

    try {
      await FinancialService.deleteBill(id, user.uid);
      setBills(prev => prev.filter(item => item.id !== id));
      toast.success('Bill deleted successfully');
    } catch (err: any) {
      console.error('Error deleting bill:', err);
      toast.error(err.message || 'Failed to delete bill');
      throw err;
    }
  }, [user]);

  const markBillAsPaid = useCallback(async (id: string, paidDate?: string) => {
    if (!user) {
      toast.error('You must be logged in to mark a bill as paid');
      return;
    }

    try {
      await FinancialService.markBillAsPaid(id, user.uid, paidDate);
      setBills(prev => prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              isPaid: true, 
              paidDate: paidDate || new Date().toISOString(),
              updatedAt: new Date().toISOString() 
            } 
          : item
      ));
      toast.success('Bill marked as paid');
      // Refresh to get any new recurring bills
      fetchBills();
    } catch (err: any) {
      console.error('Error marking bill as paid:', err);
      toast.error(err.message || 'Failed to mark bill as paid');
      throw err;
    }
  }, [user, fetchBills]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return {
    bills,
    loading,
    error,
    addBill,
    updateBill,
    deleteBill,
    markBillAsPaid,
    refetch: fetchBills
  };
}

export function useExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await FinancialService.getExpenses(user.uid);
      setExpenses(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching expenses:', err);
      setError(err);
      toast.error('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('You must be logged in to add an expense');
      return;
    }

    try {
      const newExpense = await FinancialService.addExpense(expense, user.uid);
      setExpenses(prev => [newExpense, ...prev]);
      toast.success('Expense added successfully');
      return newExpense;
    } catch (err: any) {
      console.error('Error adding expense:', err);
      toast.error(err.message || 'Failed to add expense');
      throw err;
    }
  }, [user]);

  const updateExpense = useCallback(async (expense: Partial<Expense> & { id: string }) => {
    if (!user) {
      toast.error('You must be logged in to update an expense');
      return;
    }

    try {
      await FinancialService.updateExpense(expense, user.uid);
      setExpenses(prev => prev.map(item => 
        item.id === expense.id ? { ...item, ...expense, updatedAt: new Date().toISOString() } : item
      ));
      toast.success('Expense updated successfully');
    } catch (err: any) {
      console.error('Error updating expense:', err);
      toast.error(err.message || 'Failed to update expense');
      throw err;
    }
  }, [user]);

  const deleteExpense = useCallback(async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete an expense');
      return;
    }

    try {
      await FinancialService.deleteExpense(id, user.uid);
      setExpenses(prev => prev.filter(item => item.id !== id));
      toast.success('Expense deleted successfully');
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      toast.error(err.message || 'Failed to delete expense');
      throw err;
    }
  }, [user]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses
  };
}

export function useBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBudgets = useCallback(async () => {
    if (!user) {
      setBudgets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // In a real app, this would fetch from Firebase
      // Placeholder data for now
      const data = await FinancialService.getBudgets(user.uid);
      setBudgets(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching budgets:', err);
      setError(err);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addBudget = useCallback(async (budget: any) => {
    if (!user) {
      toast.error('You must be logged in to add a budget');
      return;
    }

    try {
      const newBudget = await FinancialService.addBudget(budget, user.uid);
      setBudgets(prev => [newBudget, ...prev]);
      toast.success('Budget added successfully');
      return newBudget;
    } catch (err: any) {
      console.error('Error adding budget:', err);
      toast.error(err.message || 'Failed to add budget');
      throw err;
    }
  }, [user]);

  const updateBudget = useCallback(async (budget: any) => {
    if (!user) {
      toast.error('You must be logged in to update a budget');
      return;
    }

    try {
      await FinancialService.updateBudget(budget, user.uid);
      setBudgets(prev => prev.map(item => 
        item.id === budget.id ? { ...item, ...budget, updatedAt: new Date().toISOString() } : item
      ));
      toast.success('Budget updated successfully');
    } catch (err: any) {
      console.error('Error updating budget:', err);
      toast.error(err.message || 'Failed to update budget');
      throw err;
    }
  }, [user]);

  const deleteBudget = useCallback(async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a budget');
      return;
    }

    try {
      await FinancialService.deleteBudget(id, user.uid);
      setBudgets(prev => prev.filter(item => item.id !== id));
      toast.success('Budget deleted successfully');
    } catch (err: any) {
      console.error('Error deleting budget:', err);
      toast.error(err.message || 'Failed to delete budget');
      throw err;
    }
  }, [user]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    refetch: fetchBudgets
  };
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await FinancialService.getGoals(user.uid);
      setGoals(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching goals:', err);
      setError(err);
      toast.error('Failed to load goal data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addGoal = useCallback(async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('You must be logged in to add a goal');
      return;
    }

    try {
      const newGoal = await FinancialService.addGoal(goal, user.uid);
      setGoals(prev => [newGoal, ...prev].sort((a, b) => 
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
      ));
      toast.success('Goal added successfully');
      return newGoal;
    } catch (err: any) {
      console.error('Error adding goal:', err);
      toast.error(err.message || 'Failed to add goal');
      throw err;
    }
  }, [user]);

  const updateGoal = useCallback(async (goal: Partial<Goal> & { id: string }) => {
    if (!user) {
      toast.error('You must be logged in to update a goal');
      return;
    }

    try {
      await FinancialService.updateGoal(goal, user.uid);
      setGoals(prev => prev.map(item => 
        item.id === goal.id ? { ...item, ...goal, updatedAt: new Date().toISOString() } : item
      ).sort((a, b) => 
        new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
      ));
      toast.success('Goal updated successfully');
    } catch (err: any) {
      console.error('Error updating goal:', err);
      toast.error(err.message || 'Failed to update goal');
      throw err;
    }
  }, [user]);

  const deleteGoal = useCallback(async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a goal');
      return;
    }

    try {
      await FinancialService.deleteGoal(id, user.uid);
      setGoals(prev => prev.filter(item => item.id !== id));
      toast.success('Goal deleted successfully');
    } catch (err: any) {
      console.error('Error deleting goal:', err);
      toast.error(err.message || 'Failed to delete goal');
      throw err;
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    refetch: fetchGoals
  };
}

// Helper hook to fetch all financial data at once
export function useFinancialData() {
  const profile = useFinancialProfile();
  const incomes = useIncomes();
  const bills = useBills();
  const expenses = useExpenses();
  const budgets = useBudgets();
  const goals = useGoals();
  
  const loading = 
    profile.loading || 
    incomes.loading || 
    bills.loading || 
    expenses.loading || 
    budgets.loading ||
    goals.loading;
  
  const refetchAll = useCallback(() => {
    profile.refetch();
    incomes.refetch();
    bills.refetch();
    expenses.refetch();
    budgets.refetch();
    goals.refetch();
  }, [profile, incomes, bills, expenses, budgets, goals]);
  
  return {
    profile,
    incomes,
    bills,
    expenses,
    budgets,
    goals,
    loading,
    refetchAll
  };
} 