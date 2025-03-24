import { db } from '@/lib/firebase-client';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Stores Plaid access tokens and item IDs in Firestore
 * 
 * @param userId The user ID
 * @param accessToken The Plaid access token
 * @param itemId The Plaid item ID
 * @param institutionName Optional institution name
 */
export async function storePlaidToken(
  userId: string,
  accessToken: string,
  itemId: string,
  institutionName?: string
): Promise<void> {
  try {
    // Check if db is null before using it
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    const plaidItemRef = doc(db, 'plaid_items', itemId);
    
    await setDoc(plaidItemRef, {
      user_id: userId,
      access_token: accessToken,
      item_id: itemId,
      institution_name: institutionName || 'Financial Institution',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    console.log('Plaid token stored successfully');
  } catch (error) {
    console.error('Error storing Plaid token:', error);
    throw error;
  }
}

/**
 * Retrieves a Plaid access token for a specific item
 * 
 * @param itemId The Plaid item ID
 * @returns The access token or null if not found
 */
export async function getPlaidToken(itemId: string): Promise<string | null> {
  try {
    // Check if db is null before using it
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    const plaidItemRef = doc(db, 'plaid_items', itemId);
    const docSnap = await getDoc(plaidItemRef);
    
    if (docSnap.exists()) {
      return docSnap.data().access_token;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving Plaid token:', error);
    throw error;
  }
}

/**
 * Gets all Plaid items for a user
 * 
 * @param userId The user ID
 * @returns Array of Plaid items
 */
export async function getUserPlaidItems(userId: string) {
  try {
    // Check if db is null before using it
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    const plaidItemsQuery = query(
      collection(db, 'plaid_items'),
      where('user_id', '==', userId)
    );
    
    const querySnapshot = await getDocs(plaidItemsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user Plaid items:', error);
    throw error;
  }
}

/**
 * Store bank accounts retrieved from Plaid in Firestore
 * 
 * @param userId The user ID
 * @param householdId The household ID
 * @param itemId The Plaid item ID
 * @param accounts Array of accounts from Plaid
 */
export async function storePlaidAccounts(
  userId: string,
  householdId: string,
  itemId: string,
  accounts: any[]
) {
  try {
    // Check if db is null before using it
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    // Process each account
    for (const account of accounts) {
      // Generate a Firebase-friendly ID
      const accountId = `plaid-${account.account_id}`;
      const accountRef = doc(db, 'financial_accounts', accountId);
      
      // Check if account already exists
      const docSnap = await getDoc(accountRef);
      
      if (!docSnap.exists()) {
        // Map Plaid account type to our schema
        let accountType = 'other';
        if (account.type === 'depository' && account.subtype === 'checking') {
          accountType = 'checking';
        } else if (account.type === 'depository' && account.subtype === 'savings') {
          accountType = 'savings';
        } else if (account.type === 'credit') {
          accountType = 'credit';
        } else if (account.type === 'investment') {
          accountType = 'investment';
        } else if (account.type === 'loan') {
          accountType = 'loan';
        }
        
        // Create the account
        await setDoc(accountRef, {
          household_id: householdId,
          name: account.name,
          type: accountType,
          balance: account.balances.current || 0,
          currency: account.balances.iso_currency_code || 'USD',
          institution: account.institution_name || 'Linked Institution',
          account_number: account.mask ? `****${account.mask}` : 'Unknown',
          is_active: true,
          plaid_account_id: account.account_id,
          plaid_item_id: itemId,
          last_synced_at: new Date().toISOString(),
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        // Update existing account
        await setDoc(accountRef, {
          balance: account.balances.current || 0,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { merge: true });
      }
    }
    
    console.log(`${accounts.length} accounts stored/updated successfully`);
  } catch (error) {
    console.error('Error storing Plaid accounts:', error);
    throw error;
  }
}

/**
 * Store transactions retrieved from Plaid in Firestore
 * 
 * @param userId The user ID
 * @param transactions Array of transactions from Plaid
 */
export async function storePlaidTransactions(
  userId: string,
  transactions: any[]
) {
  try {
    // Check if db is null before using it
    if (!db) {
      throw new Error('Firestore is not initialized');
    }
    
    for (const transaction of transactions) {
      // Generate a Firebase-friendly ID
      const transactionId = `plaid-${transaction.transaction_id}`;
      const transactionRef = doc(db, 'transactions', transactionId);
      
      // Check if transaction already exists
      const docSnap = await getDoc(transactionRef);
      
      if (!docSnap.exists()) {
        // Get account details for this transaction
        const accountId = `plaid-${transaction.account_id}`;
        
        // Determine if it's income or expense based on amount
        const isIncome = transaction.amount < 0;
        
        // Find a matching category (simplified)
        // In a real app, you'd have more sophisticated category matching
        let categoryId = null;
        
        // Create the transaction
        await setDoc(transactionRef, {
          account_id: accountId,
          category_id: categoryId,
          amount: Math.abs(transaction.amount),
          currency: transaction.iso_currency_code || 'USD',
          description: transaction.name,
          notes: transaction.merchant_name || '',
          date: transaction.date,
          is_income: isIncome,
          is_recurring: false,
          is_split: false,
          plaid_transaction_id: transaction.transaction_id,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }
    
    console.log(`${transactions.length} transactions processed`);
  } catch (error) {
    console.error('Error storing Plaid transactions:', error);
    throw error;
  }
} 