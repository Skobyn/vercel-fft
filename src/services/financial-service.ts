import { db } from '@/lib/firebase-client';
import { User } from '@/providers/firebase-auth-provider';
import {
  Income,
  Bill,
  Expense,
  Budget,
  Goal,
  BalanceAdjustment,
  FinancialProfile
} from '@/types/financial';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Helper for creating timestamps
const toISOString = (date: Date | string) => {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
};

// Get a user's financial profile
export const getFinancialProfile = async (userId: string): Promise<FinancialProfile | null> => {
  try {
    const docRef = doc(db, 'financialProfiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as FinancialProfile;
    }
    
    // Create a default profile if not exists
    const defaultProfile: FinancialProfile = {
      userId,
      currentBalance: 0,
      lastUpdated: new Date().toISOString(),
      currency: 'USD',
      hasCompletedSetup: false
    };
    
    await setDoc(docRef, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error('Error getting financial profile:', error);
    throw error;
  }
};

// Update a user's current balance
export const updateBalance = async (
  userId: string, 
  newBalance: number, 
  reason: string
): Promise<FinancialProfile> => {
  try {
    const profileRef = doc(db, 'financialProfiles', userId);
    const profileSnap = await getDoc(profileRef);
    
    if (!profileSnap.exists()) {
      throw new Error('Financial profile not found');
    }
    
    const profile = profileSnap.data() as FinancialProfile;
    const previousBalance = profile.currentBalance;
    
    // Update the profile
    const updatedProfile: Partial<FinancialProfile> = {
      currentBalance: newBalance,
      lastUpdated: new Date().toISOString(),
    };
    
    await updateDoc(profileRef, updatedProfile);
    
    // Create a balance adjustment record
    const adjustmentData: Omit<BalanceAdjustment, 'id'> = {
      userId,
      name: 'Balance Adjustment',
      amount: newBalance - previousBalance,
      previousBalance,
      newBalance,
      reason,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await addDoc(collection(db, 'balanceAdjustments'), adjustmentData);
    
    return { ...profile, ...updatedProfile };
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

// INCOME OPERATIONS
export const addIncome = async (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Income> => {
  try {
    const now = new Date().toISOString();
    const newIncome: Omit<Income, 'id'> = {
      ...income,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, 'incomes'), newIncome);
    return { id: docRef.id, ...newIncome };
  } catch (error) {
    console.error('Error adding income:', error);
    throw error;
  }
};

export const updateIncome = async (income: Partial<Income> & { id: string }, userId: string): Promise<void> => {
  try {
    const { id, ...data } = income;
    const incomeRef = doc(db, 'incomes', id);
    
    // Verify ownership
    const incomeSnap = await getDoc(incomeRef);
    if (!incomeSnap.exists() || incomeSnap.data().userId !== userId) {
      throw new Error('Income not found or unauthorized');
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(incomeRef, updatedData);
  } catch (error) {
    console.error('Error updating income:', error);
    throw error;
  }
};

export const deleteIncome = async (id: string, userId: string): Promise<void> => {
  try {
    const incomeRef = doc(db, 'incomes', id);
    
    // Verify ownership
    const incomeSnap = await getDoc(incomeRef);
    if (!incomeSnap.exists() || incomeSnap.data().userId !== userId) {
      throw new Error('Income not found or unauthorized');
    }
    
    await deleteDoc(incomeRef);
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
};

export const getIncomes = async (userId: string): Promise<Income[]> => {
  try {
    const incomesQuery = query(
      collection(db, 'incomes'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(incomesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income));
  } catch (error) {
    console.error('Error getting incomes:', error);
    throw error;
  }
};

// BILL OPERATIONS
export const addBill = async (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Bill> => {
  try {
    const now = new Date().toISOString();
    const newBill: Omit<Bill, 'id'> = {
      ...bill,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, 'bills'), newBill);
    return { id: docRef.id, ...newBill };
  } catch (error) {
    console.error('Error adding bill:', error);
    throw error;
  }
};

export const updateBill = async (bill: Partial<Bill> & { id: string }, userId: string): Promise<void> => {
  try {
    const { id, ...data } = bill;
    const billRef = doc(db, 'bills', id);
    
    // Verify ownership
    const billSnap = await getDoc(billRef);
    if (!billSnap.exists() || billSnap.data().userId !== userId) {
      throw new Error('Bill not found or unauthorized');
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(billRef, updatedData);
  } catch (error) {
    console.error('Error updating bill:', error);
    throw error;
  }
};

export const deleteBill = async (id: string, userId: string): Promise<void> => {
  try {
    const billRef = doc(db, 'bills', id);
    
    // Verify ownership
    const billSnap = await getDoc(billRef);
    if (!billSnap.exists() || billSnap.data().userId !== userId) {
      throw new Error('Bill not found or unauthorized');
    }
    
    await deleteDoc(billRef);
  } catch (error) {
    console.error('Error deleting bill:', error);
    throw error;
  }
};

export const getBills = async (userId: string): Promise<Bill[]> => {
  try {
    const billsQuery = query(
      collection(db, 'bills'),
      where('userId', '==', userId),
      orderBy('dueDate', 'asc')
    );
    
    const querySnapshot = await getDocs(billsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
  } catch (error) {
    console.error('Error getting bills:', error);
    throw error;
  }
};

// Mark a bill as paid
export const markBillAsPaid = async (id: string, userId: string, paidDate?: string): Promise<void> => {
  try {
    const billRef = doc(db, 'bills', id);
    
    // Verify ownership
    const billSnap = await getDoc(billRef);
    if (!billSnap.exists() || billSnap.data().userId !== userId) {
      throw new Error('Bill not found or unauthorized');
    }
    
    const updateData = {
      isPaid: true,
      paidDate: paidDate || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(billRef, updateData);
    
    // If this is a recurring bill, create the next instance
    const billData = billSnap.data() as Bill;
    if (billData.isRecurring && billData.frequency !== 'once') {
      // Calculate next due date based on frequency
      let nextDate = new Date(billData.dueDate);
      
      switch (billData.frequency) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'biweekly':
          nextDate.setDate(nextDate.getDate() + 14);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'annually':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
      
      // Update next due date
      await updateDoc(billRef, {
        nextDueDate: nextDate.toISOString()
      });
    }
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    throw error;
  }
};

// EXPENSE OPERATIONS
export const addExpense = async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Expense> => {
  try {
    const now = new Date().toISOString();
    const newExpense: Omit<Expense, 'id'> = {
      ...expense,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, 'expenses'), newExpense);
    return { id: docRef.id, ...newExpense };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const updateExpense = async (expense: Partial<Expense> & { id: string }, userId: string): Promise<void> => {
  try {
    const { id, ...data } = expense;
    const expenseRef = doc(db, 'expenses', id);
    
    // Verify ownership
    const expenseSnap = await getDoc(expenseRef);
    if (!expenseSnap.exists() || expenseSnap.data().userId !== userId) {
      throw new Error('Expense not found or unauthorized');
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(expenseRef, updatedData);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: string, userId: string): Promise<void> => {
  try {
    const expenseRef = doc(db, 'expenses', id);
    
    // Verify ownership
    const expenseSnap = await getDoc(expenseRef);
    if (!expenseSnap.exists() || expenseSnap.data().userId !== userId) {
      throw new Error('Expense not found or unauthorized');
    }
    
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(expensesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw error;
  }
};

// BUDGET OPERATIONS
export const addBudget = async (budget: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Budget> => {
  try {
    const now = new Date().toISOString();
    const newBudget: Omit<Budget, 'id'> = {
      ...budget,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, 'budgets'), newBudget);
    return { id: docRef.id, ...newBudget };
  } catch (error) {
    console.error('Error adding budget:', error);
    throw error;
  }
};

export const updateBudget = async (budget: Partial<Budget> & { id: string }, userId: string): Promise<void> => {
  try {
    const { id, ...data } = budget;
    const budgetRef = doc(db, 'budgets', id);
    
    // Verify ownership
    const budgetSnap = await getDoc(budgetRef);
    if (!budgetSnap.exists() || budgetSnap.data().userId !== userId) {
      throw new Error('Budget not found or unauthorized');
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(budgetRef, updatedData);
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

export const deleteBudget = async (id: string, userId: string): Promise<void> => {
  try {
    const budgetRef = doc(db, 'budgets', id);
    
    // Verify ownership
    const budgetSnap = await getDoc(budgetRef);
    if (!budgetSnap.exists() || budgetSnap.data().userId !== userId) {
      throw new Error('Budget not found or unauthorized');
    }
    
    await deleteDoc(budgetRef);
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};

export const getBudgets = async (userId: string): Promise<Budget[]> => {
  try {
    const budgetsQuery = query(
      collection(db, 'budgets'),
      where('userId', '==', userId),
      orderBy('startDate', 'desc')
    );
    
    const querySnapshot = await getDocs(budgetsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
  } catch (error) {
    console.error('Error getting budgets:', error);
    throw error;
  }
};

// GOAL OPERATIONS
export const addGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Goal> => {
  try {
    const now = new Date().toISOString();
    const newGoal: Omit<Goal, 'id'> = {
      ...goal,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, 'goals'), newGoal);
    return { id: docRef.id, ...newGoal };
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
};

export const updateGoal = async (goal: Partial<Goal> & { id: string }, userId: string): Promise<void> => {
  try {
    const { id, ...data } = goal;
    const goalRef = doc(db, 'goals', id);
    
    // Verify ownership
    const goalSnap = await getDoc(goalRef);
    if (!goalSnap.exists() || goalSnap.data().userId !== userId) {
      throw new Error('Goal not found or unauthorized');
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(goalRef, updatedData);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteGoal = async (id: string, userId: string): Promise<void> => {
  try {
    const goalRef = doc(db, 'goals', id);
    
    // Verify ownership
    const goalSnap = await getDoc(goalRef);
    if (!goalSnap.exists() || goalSnap.data().userId !== userId) {
      throw new Error('Goal not found or unauthorized');
    }
    
    await deleteDoc(goalRef);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

export const getGoals = async (userId: string): Promise<Goal[]> => {
  try {
    const goalsQuery = query(
      collection(db, 'goals'),
      where('userId', '==', userId),
      orderBy('targetDate', 'asc')
    );
    
    const querySnapshot = await getDocs(goalsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
}; 