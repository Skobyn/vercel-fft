import { db } from '@/lib/firebase-client';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Creates a new household for a user
 * @param userId - The user's ID
 * @param name - The household name
 * @returns The ID of the created household
 */
export async function createHouseholdForUser(userId: string, name: string = 'My Household'): Promise<string> {
  try {
    // Check if db is null before using it
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    // Create the household
    const householdRef = await addDoc(collection(db, 'households'), {
      name,
      created_by: userId,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    });

    // Create household membership
    await addDoc(collection(db, 'household_members'), {
      household_id: householdRef.id,
      profile_id: userId,
      role: 'owner',
      joined_at: Timestamp.now()
    });

    return householdRef.id;
  } catch (error) {
    console.error('Error creating household:', error);
    throw error;
  }
}

/**
 * Creates default categories for a household
 * @param householdId - The household ID
 */
export async function createDefaultCategories(householdId: string): Promise<void> {
  try {
    // Check if db is null before using it
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    const incomeCategories = [
      { name: 'Salary', type: 'income', color: '#4CAF50', icon: 'briefcase' },
      { name: 'Bonus', type: 'income', color: '#8BC34A', icon: 'gift' },
      { name: 'Interest', type: 'income', color: '#2196F3', icon: 'trending-up' },
      { name: 'Investments', type: 'income', color: '#9C27B0', icon: 'bar-chart' },
      { name: 'Other Income', type: 'income', color: '#607D8B', icon: 'plus-circle' }
    ];

    const expenseCategories = [
      { name: 'Housing', type: 'expense', color: '#F44336', icon: 'home' },
      { name: 'Utilities', type: 'expense', color: '#FF9800', icon: 'zap' },
      { name: 'Groceries', type: 'expense', color: '#FF5722', icon: 'shopping-cart' },
      { name: 'Transportation', type: 'expense', color: '#795548', icon: 'truck' },
      { name: 'Dining Out', type: 'expense', color: '#E91E63', icon: 'coffee' },
      { name: 'Entertainment', type: 'expense', color: '#673AB7', icon: 'film' },
      { name: 'Medical', type: 'expense', color: '#03A9F4', icon: 'activity' },
      { name: 'Insurance', type: 'expense', color: '#3F51B5', icon: 'shield' },
      { name: 'Debt Payments', type: 'expense', color: '#F44336', icon: 'credit-card' },
      { name: 'Savings', type: 'expense', color: '#009688', icon: 'piggy-bank' },
      { name: 'Personal Care', type: 'expense', color: '#00BCD4', icon: 'user' },
      { name: 'Education', type: 'expense', color: '#4CAF50', icon: 'book' },
      { name: 'Shopping', type: 'expense', color: '#9C27B0', icon: 'shopping-bag' },
      { name: 'Travel', type: 'expense', color: '#2196F3', icon: 'map' },
      { name: 'Gifts', type: 'expense', color: '#E91E63', icon: 'gift' },
      { name: 'Charitable Donations', type: 'expense', color: '#8BC34A', icon: 'heart' },
      { name: 'Miscellaneous', type: 'expense', color: '#607D8B', icon: 'grid' }
    ];

    // Add income categories
    for (const category of incomeCategories) {
      await addDoc(collection(db, 'categories'), {
        ...category,
        household_id: householdId,
        is_default: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    }

    // Add expense categories
    for (const category of expenseCategories) {
      await addDoc(collection(db, 'categories'), {
        ...category,
        household_id: householdId,
        is_default: true,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error creating default categories:', error);
    throw error;
  }
}

/**
 * Creates default accounts for a household
 * @param householdId - The household ID
 */
export async function createDefaultAccounts(householdId: string): Promise<void> {
  try {
    // Check if db is null before using it
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    const defaultAccounts = [
      { 
        name: 'Checking Account', 
        type: 'checking', 
        balance: 1000, 
        currency: 'USD',
        is_active: true 
      },
      { 
        name: 'Savings Account', 
        type: 'savings', 
        balance: 5000, 
        currency: 'USD',
        is_active: true 
      },
      { 
        name: 'Credit Card', 
        type: 'credit', 
        balance: 0, 
        currency: 'USD',
        is_active: true 
      }
    ];

    for (const account of defaultAccounts) {
      await addDoc(collection(db, 'financial_accounts'), {
        ...account,
        household_id: householdId,
        institution: 'Example Bank',
        account_number: '****' + Math.floor(1000 + Math.random() * 9000),
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error creating default accounts:', error);
    throw error;
  }
}

/**
 * Initializes a new user with default data
 * @param userId - The user's ID
 * @param householdName - Optional household name
 */
export async function initializeUserData(userId: string, householdName?: string): Promise<void> {
  try {
    // Create a household for the user
    const householdId = await createHouseholdForUser(userId, householdName);
    
    // Create default categories
    await createDefaultCategories(householdId);
    
    // Create default accounts
    await createDefaultAccounts(householdId);
    
    console.log('User data initialized successfully!');
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
} 