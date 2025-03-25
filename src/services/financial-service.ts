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
    console.log("Getting financial profile for user:", userId);
    const docRef = doc(db, 'financialProfiles', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("Financial profile found:", docSnap.data());
      return docSnap.data() as FinancialProfile;
    } else {
      console.log("Financial profile not found, creating default");
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
    console.log("Default profile created successfully");
    return defaultProfile;
  } catch (error) {
    console.error('Error getting financial profile:', error);
    // Return a default profile rather than throwing
    return {
      userId,
      currentBalance: 0,
      lastUpdated: new Date().toISOString(),
      currency: 'USD',
      hasCompletedSetup: false
    };
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
    
    let profile: FinancialProfile;
    let previousBalance = 0;
    
    if (profileSnap.exists()) {
      profile = profileSnap.data() as FinancialProfile;
      previousBalance = profile.currentBalance;
    } else {
      // Create a default profile if it doesn't exist
      profile = {
        userId,
        currentBalance: 0,
        lastUpdated: new Date().toISOString(),
        currency: 'USD',
        hasCompletedSetup: false
      };
    }
    
    // Update the profile
    const updatedProfile: FinancialProfile = {
      ...profile,
      currentBalance: newBalance,
      lastUpdated: new Date().toISOString(),
      hasCompletedSetup: true // Mark that setup has begun
    };
    
    // Use setDoc with merge to handle both create and update
    await setDoc(profileRef, updatedProfile, { merge: true });
    
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
    
    // Store balance adjustment in user-specific collection
    await addDoc(collection(db, `users/${userId}/balanceAdjustments`), adjustmentData);
    
    return updatedProfile;
  } catch (error) {
    console.error('Error updating balance:', error);
    throw error;
  }
};

// INCOME OPERATIONS
export const addIncome = async (income: Omit<Income, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Income> => {
  try {
    console.log(`Adding income for user ${userId}:`, income);
    const now = new Date().toISOString();
    const newIncome: Omit<Income, 'id'> = {
      ...income,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    // Always use the user-specific path for new incomes
    const docRef = await addDoc(collection(db, `users/${userId}/incomes`), newIncome);
    console.log(`Income added successfully with ID: ${docRef.id}`);
    return { id: docRef.id, ...newIncome };
  } catch (error) {
    console.error('Error adding income:', error);
    throw error;
  }
};

export const updateIncome = async (income: Partial<Income> & { id: string }, userId: string): Promise<void> => {
  try {
    const { id, ...data } = income;
    const incomeRef = doc(db, `users/${userId}/incomes`, id);
    
    // Verify existence
    const incomeSnap = await getDoc(incomeRef);
    if (!incomeSnap.exists()) {
      throw new Error('Income not found');
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
    const incomeRef = doc(db, `users/${userId}/incomes`, id);
    
    // Verify existence
    const incomeSnap = await getDoc(incomeRef);
    if (!incomeSnap.exists()) {
      throw new Error('Income not found');
    }
    
    await deleteDoc(incomeRef);
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
};

export const getIncomes = async (userId: string): Promise<Income[]> => {
  try {
    console.log(`Getting incomes for user ${userId} from users/${userId}/incomes`);
    
    // Try the user-specific path first
    try {
      const incomesQuery = query(
        collection(db, `users/${userId}/incomes`),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(incomesQuery);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income));
      console.log(`Found ${results.length} incomes in users/${userId}/incomes`);
      return results;
    } catch (pathError) {
      console.error(`Error accessing users/${userId}/incomes:`, pathError);
      
      // Try the global collection as fallback
      console.log("Trying global incomes collection as fallback");
      const fallbackQuery = query(
        collection(db, 'incomes'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackResults = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Income));
      console.log(`Found ${fallbackResults.length} incomes in global collection`);
      
      // If we found items in the global collection, migrate them to the user-specific path
      if (fallbackResults.length > 0) {
        console.log("Migrating income data to user-specific path");
        
        for (const income of fallbackResults) {
          const { id, ...data } = income;
          await setDoc(doc(db, `users/${userId}/incomes`, id), data);
        }
      }
      
      return fallbackResults;
    }
  } catch (error) {
    console.error('Error getting incomes:', error);
    
    // Return empty array rather than throwing
    console.log("Returning empty incomes array due to error");
    return [];
  }
};

// BILL OPERATIONS
export const addBill = async (bill: Omit<Bill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Bill> => {
  try {
    console.log(`Adding bill for user ${userId}:`, bill);
    const now = new Date().toISOString();
    const newBill: Omit<Bill, 'id'> = {
      ...bill,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    // Use user-specific path
    const docRef = await addDoc(collection(db, `users/${userId}/bills`), newBill);
    console.log(`Bill added successfully with ID: ${docRef.id}`);
    return { id: docRef.id, ...newBill };
  } catch (error) {
    console.error('Error adding bill:', error);
    throw error;
  }
};

export const updateBill = async (bill: Partial<Bill> & { id: string }, userId: string): Promise<void> => {
  try {
    console.log(`Updating bill for user ${userId}, ID: ${bill.id}`);
    const { id, ...data } = bill;
    const billRef = doc(db, `users/${userId}/bills`, id);
    
    // Verify existence
    const billSnap = await getDoc(billRef);
    if (!billSnap.exists()) {
      throw new Error('Bill not found');
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(billRef, updatedData);
    console.log(`Bill updated successfully: ${id}`);
  } catch (error) {
    console.error('Error updating bill:', error);
    throw error;
  }
};

export const deleteBill = async (id: string, userId: string): Promise<void> => {
  try {
    console.log(`Deleting bill for user ${userId}, ID: ${id}`);
    const billRef = doc(db, `users/${userId}/bills`, id);
    
    // Verify existence
    const billSnap = await getDoc(billRef);
    if (!billSnap.exists()) {
      throw new Error('Bill not found');
    }
    
    await deleteDoc(billRef);
    console.log(`Bill deleted successfully: ${id}`);
  } catch (error) {
    console.error('Error deleting bill:', error);
    throw error;
  }
};

export const getBills = async (userId: string): Promise<Bill[]> => {
  try {
    console.log(`Getting bills for user ${userId} from users/${userId}/bills`);
    
    // Try the user-specific path first
    try {
      const billsQuery = query(
        collection(db, `users/${userId}/bills`),
        orderBy('dueDate', 'asc')
      );
      
      const querySnapshot = await getDocs(billsQuery);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
      console.log(`Found ${results.length} bills in users/${userId}/bills`);
      return results;
    } catch (pathError) {
      console.error(`Error accessing users/${userId}/bills:`, pathError);
      
      // Try the global collection as fallback
      console.log("Trying global bills collection as fallback");
      const fallbackQuery = query(
        collection(db, 'bills'),
        where('userId', '==', userId),
        orderBy('dueDate', 'asc')
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackResults = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bill));
      console.log(`Found ${fallbackResults.length} bills in global collection`);
      
      // If we found items in the global collection, migrate them to the user-specific path
      if (fallbackResults.length > 0) {
        console.log("Migrating bill data to user-specific path");
        
        for (const bill of fallbackResults) {
          const { id, ...data } = bill;
          await setDoc(doc(db, `users/${userId}/bills`, id), data);
        }
      }
      
      return fallbackResults;
    }
  } catch (error) {
    console.error('Error getting bills:', error);
    
    // Return empty array rather than throwing
    console.log("Returning empty bills array due to error");
    return [];
  }
};

// Mark a bill as paid
export const markBillAsPaid = async (id: string, userId: string, paidDate?: string): Promise<void> => {
  try {
    console.log(`Marking bill as paid for user ${userId}, ID: ${id}`);
    const billRef = doc(db, `users/${userId}/bills`, id);
    
    // Verify existence
    const billSnap = await getDoc(billRef);
    if (!billSnap.exists()) {
      throw new Error('Bill not found');
    }
    
    const updateData = {
      isPaid: true,
      paidDate: paidDate || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(billRef, updateData);
    console.log(`Bill marked as paid: ${id}`);
    
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
      console.log(`Next due date updated for recurring bill: ${id}`);
    }
  } catch (error) {
    console.error('Error marking bill as paid:', error);
    throw error;
  }
};

// EXPENSE OPERATIONS
export const addExpense = async (expense: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Expense> => {
  try {
    console.log(`Adding expense for user ${userId}:`, expense);
    const now = new Date().toISOString();
    const newExpense: Omit<Expense, 'id'> = {
      ...expense,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    // Use user-specific path
    const docRef = await addDoc(collection(db, `users/${userId}/expenses`), newExpense);
    console.log(`Expense added successfully with ID: ${docRef.id}`);
    return { id: docRef.id, ...newExpense };
  } catch (error) {
    console.error('Error adding expense:', error);
    throw error;
  }
};

export const updateExpense = async (expense: Partial<Expense> & { id: string }, userId: string): Promise<void> => {
  try {
    console.log(`Updating expense for user ${userId}, ID: ${expense.id}`);
    const { id, ...data } = expense;
    const expenseRef = doc(db, `users/${userId}/expenses`, id);
    
    // Verify existence
    const expenseSnap = await getDoc(expenseRef);
    if (!expenseSnap.exists()) {
      throw new Error('Expense not found');
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(expenseRef, updatedData);
    console.log(`Expense updated successfully: ${id}`);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

export const deleteExpense = async (id: string, userId: string): Promise<void> => {
  try {
    console.log(`Deleting expense for user ${userId}, ID: ${id}`);
    const expenseRef = doc(db, `users/${userId}/expenses`, id);
    
    // Verify existence
    const expenseSnap = await getDoc(expenseRef);
    if (!expenseSnap.exists()) {
      throw new Error('Expense not found');
    }
    
    await deleteDoc(expenseRef);
    console.log(`Expense deleted successfully: ${id}`);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

export const getExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    console.log(`Getting expenses for user ${userId} from users/${userId}/expenses`);
    
    // Try the user-specific path first
    try {
      const expensesQuery = query(
        collection(db, `users/${userId}/expenses`),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(expensesQuery);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      console.log(`Found ${results.length} expenses in users/${userId}/expenses`);
      return results;
    } catch (pathError) {
      console.error(`Error accessing users/${userId}/expenses:`, pathError);
      
      // Try the global collection as fallback
      console.log("Trying global expenses collection as fallback");
      const fallbackQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackResults = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      console.log(`Found ${fallbackResults.length} expenses in global collection`);
      
      // If we found items in the global collection, migrate them to the user-specific path
      if (fallbackResults.length > 0) {
        console.log("Migrating expense data to user-specific path");
        
        for (const expense of fallbackResults) {
          const { id, ...data } = expense;
          await setDoc(doc(db, `users/${userId}/expenses`, id), data);
        }
      }
      
      return fallbackResults;
    }
  } catch (error) {
    console.error('Error getting expenses:', error);
    
    // Return empty array rather than throwing
    console.log("Returning empty expenses array due to error");
    return [];
  }
};

// BUDGET OPERATIONS
export const addBudget = async (budget: any, userId: string): Promise<any> => {
  try {
    const now = new Date().toISOString();
    const newBudget = {
      ...budget,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    const docRef = await addDoc(collection(db, `users/${userId}/budgets`), newBudget);
    return { id: docRef.id, ...newBudget };
  } catch (error) {
    console.error('Error adding budget:', error);
    throw error;
  }
};

export const updateBudget = async (budget: any & { id: string }, userId: string): Promise<void> => {
  try {
    const { id, ...data } = budget;
    const budgetRef = doc(db, `users/${userId}/budgets`, id);
    
    // Verify ownership
    const budgetSnap = await getDoc(budgetRef);
    if (!budgetSnap.exists()) {
      throw new Error('Budget not found');
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
    const budgetRef = doc(db, `users/${userId}/budgets`, id);
    
    // Verify existence
    const budgetSnap = await getDoc(budgetRef);
    if (!budgetSnap.exists()) {
      throw new Error('Budget not found');
    }
    
    await deleteDoc(budgetRef);
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};

export const getBudgets = async (userId: string): Promise<any[]> => {
  try {
    const budgetsQuery = query(
      collection(db, `users/${userId}/budgets`),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(budgetsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting budgets:', error);
    
    // Return empty array if collection doesn't exist yet
    if ((error as any)?.code === 'resource-exhausted') {
      return [];
    }
    
    throw error;
  }
};

// GOAL OPERATIONS
export const addGoal = async (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, userId: string): Promise<Goal> => {
  try {
    console.log(`Adding goal for user ${userId}:`, goal);
    const now = new Date().toISOString();
    const newGoal: Omit<Goal, 'id'> = {
      ...goal,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    
    // Use user-specific path
    const docRef = await addDoc(collection(db, `users/${userId}/goals`), newGoal);
    console.log(`Goal added successfully with ID: ${docRef.id}`);
    return { id: docRef.id, ...newGoal };
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
};

export const updateGoal = async (goal: Partial<Goal> & { id: string }, userId: string): Promise<void> => {
  try {
    console.log(`Updating goal for user ${userId}, ID: ${goal.id}`);
    const { id, ...data } = goal;
    const goalRef = doc(db, `users/${userId}/goals`, id);
    
    // Verify existence
    const goalSnap = await getDoc(goalRef);
    if (!goalSnap.exists()) {
      throw new Error('Goal not found');
    }
    
    const updatedData = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(goalRef, updatedData);
    console.log(`Goal updated successfully: ${id}`);
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteGoal = async (id: string, userId: string): Promise<void> => {
  try {
    console.log(`Deleting goal for user ${userId}, ID: ${id}`);
    const goalRef = doc(db, `users/${userId}/goals`, id);
    
    // Verify existence
    const goalSnap = await getDoc(goalRef);
    if (!goalSnap.exists()) {
      throw new Error('Goal not found');
    }
    
    await deleteDoc(goalRef);
    console.log(`Goal deleted successfully: ${id}`);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

export const getGoals = async (userId: string): Promise<Goal[]> => {
  try {
    console.log(`Getting goals for user ${userId} from users/${userId}/goals`);
    
    // Try the user-specific path first
    try {
      const goalsQuery = query(
        collection(db, `users/${userId}/goals`),
        orderBy('targetDate', 'asc')
      );
      
      const querySnapshot = await getDocs(goalsQuery);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      console.log(`Found ${results.length} goals in users/${userId}/goals`);
      return results;
    } catch (pathError) {
      console.error(`Error accessing users/${userId}/goals:`, pathError);
      
      // Try the global collection as fallback
      console.log("Trying global goals collection as fallback");
      const fallbackQuery = query(
        collection(db, 'goals'),
        where('userId', '==', userId),
        orderBy('targetDate', 'asc')
      );
      
      const fallbackSnapshot = await getDocs(fallbackQuery);
      const fallbackResults = fallbackSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      console.log(`Found ${fallbackResults.length} goals in global collection`);
      
      // If we found items in the global collection, migrate them to the user-specific path
      if (fallbackResults.length > 0) {
        console.log("Migrating goal data to user-specific path");
        
        for (const goal of fallbackResults) {
          const { id, ...data } = goal;
          await setDoc(doc(db, `users/${userId}/goals`, id), data);
        }
      }
      
      return fallbackResults;
    }
  } catch (error) {
    console.error('Error getting goals:', error);
    
    // Return empty array rather than throwing
    console.log("Returning empty goals array due to error");
    return [];
  }
};

// Add a new income record
export const addIncomeRecord = async (
  userId: string,
  incomeData: { name: string; amount: number; frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually' }
): Promise<Income> => {
  try {
    console.log(`Adding income record for user ${userId}:`, incomeData);
    // Create the income data object
    const now = new Date().toISOString();
    const newIncome: Omit<Income, 'id'> = {
      userId,
      name: incomeData.name,
      amount: incomeData.amount,
      frequency: incomeData.frequency,
      date: now,
      category: 'Other', // Default category
      isRecurring: incomeData.frequency !== 'once',
      nextDate: incomeData.frequency !== 'once' ? calculateNextPaymentDate(now, incomeData.frequency) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    
    // Add to Firestore - using user-specific path
    const docRef = await addDoc(collection(db, `users/${userId}/incomes`), newIncome);
    console.log(`Income record added successfully with ID: ${docRef.id}`);
    
    // Return the complete income object with id
    return {
      id: docRef.id,
      ...newIncome
    };
  } catch (error) {
    console.error('Error adding income record:', error);
    throw error;
  }
};

// Add a new expense record
export const addExpenseRecord = async (
  userId: string,
  expenseData: { name: string; amount: number; category: string; frequency: string }
): Promise<Expense> => {
  try {
    console.log(`Adding expense record for user ${userId}:`, expenseData);
    // Create the expense data object
    const now = new Date().toISOString();
    const newExpense: Omit<Expense, 'id'> = {
      userId,
      name: expenseData.name,
      amount: expenseData.amount,
      category: expenseData.category,
      date: now,
      isPlanned: true,
      createdAt: now,
      updatedAt: now,
    };
    
    // Add to Firestore - using user-specific path
    const docRef = await addDoc(collection(db, `users/${userId}/expenses`), newExpense);
    console.log(`Expense record added successfully with ID: ${docRef.id}`);
    
    // Return the complete expense object with id
    return {
      id: docRef.id,
      ...newExpense
    };
  } catch (error) {
    console.error('Error adding expense record:', error);
    throw error;
  }
};

// Helper function to calculate the next payment date based on frequency
function calculateNextPaymentDate(fromDate: string, frequency: 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually'): string {
  const date = new Date(fromDate);
  
  switch (frequency.toLowerCase()) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annually':
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      // For 'once' or any other value, don't set a next date
      return '';
  }
  
  return date.toISOString();
} 