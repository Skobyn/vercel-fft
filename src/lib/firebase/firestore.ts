// Financial Account
export interface FinancialAccount {
  id: string;
  userId: string;
  householdId: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';
  balance: number;
  currency: string;
  institution?: string;
  account_number?: string; 
  is_active: boolean;
  is_default: boolean;
  plaid_account_id?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Income
export interface Income {
  account_id?: string; // ID of the account this income goes to
}

// Bill
export interface Bill {
  account_id?: string; // ID of the account this bill is paid from
}

// Expense
export interface Expense {
  account_id?: string; // ID of the account this expense is paid from
}

// Collection references with types
export const collections = {
  financialAccounts: (householdId: string) => 
    collection(db, `households/${householdId}/financial_accounts`) as CollectionReference<FinancialAccount>,
}; 