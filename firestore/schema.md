# Firestore Schema Setup Guide

This document outlines the structure of collections and documents needed in Firestore for the Family Finance Tracker application.

## Collections Structure

### profiles
Stores user profile information
```
{
  id: string (matches auth user ID),
  email: string,
  first_name: string,
  last_name: string,
  avatar_url: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### households
Represents a family or group of users who share finances
```
{
  id: string,
  name: string,
  created_by: string (user ID),
  created_at: timestamp,
  updated_at: timestamp
}
```

### household_members
Junction collection to manage household memberships
```
{
  id: string,
  household_id: string,
  profile_id: string,
  role: string ('owner', 'admin', 'member'),
  joined_at: timestamp
}
```

### financial_accounts
Tracks bank accounts, credit cards, and other financial accounts
```
{
  id: string,
  household_id: string,
  name: string,
  type: string ('checking', 'savings', 'credit', 'investment', 'loan', 'other'),
  balance: number,
  currency: string,
  institution: string,
  account_number: string,
  is_active: boolean,
  plaid_account_id: string,
  last_synced_at: timestamp,
  created_at: timestamp,
  updated_at: timestamp
}
```

### categories
Transaction categories for income and expenses
```
{
  id: string,
  household_id: string,
  name: string,
  color: string,
  icon: string,
  parent_id: string (optional, for nested categories),
  type: string ('income', 'expense'),
  is_default: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

### transactions
All financial transactions
```
{
  id: string,
  account_id: string,
  category_id: string,
  amount: number,
  currency: string,
  description: string,
  notes: string,
  date: string (YYYY-MM-DD),
  is_income: boolean,
  is_recurring: boolean,
  is_split: boolean,
  plaid_transaction_id: string,
  receipt_url: string,
  created_by: string (user ID),
  created_at: timestamp,
  updated_at: timestamp
}
```

### split_transactions
For transactions split across multiple categories
```
{
  id: string,
  parent_transaction_id: string,
  category_id: string,
  amount: number,
  description: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### budgets
Budget planning
```
{
  id: string,
  household_id: string,
  name: string,
  amount: number,
  start_date: string (YYYY-MM-DD),
  end_date: string (YYYY-MM-DD),
  is_recurring: boolean,
  recurrence_period: string ('monthly', 'quarterly', 'yearly'),
  created_at: timestamp,
  updated_at: timestamp
}
```

### budget_categories
Category allocations within budgets
```
{
  id: string,
  budget_id: string,
  category_id: string,
  amount: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

### bills
Recurring bills tracking
```
{
  id: string,
  household_id: string,
  name: string,
  amount: number,
  due_date: string (YYYY-MM-DD),
  frequency: string ('one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'),
  category_id: string,
  account_id: string,
  auto_pay: boolean,
  reminder_days: number,
  status: string ('pending', 'paid', 'late'),
  created_at: timestamp,
  updated_at: timestamp
}
```

### financial_goals
Savings and financial goals
```
{
  id: string,
  household_id: string,
  name: string,
  target_amount: number,
  current_amount: number,
  target_date: string (YYYY-MM-DD),
  category_id: string,
  account_id: string,
  priority: string ('low', 'medium', 'high'),
  is_completed: boolean,
  created_at: timestamp,
  updated_at: timestamp
}
```

## Security Rules

Implement these Firebase security rules to secure your data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Profiles - accessible only by the user themselves
    match /profiles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Helper function to check if user is in household
    function isInHousehold(householdId) {
      return exists(/databases/$(database)/documents/household_members/$(request.auth.uid + '_' + householdId));
    }
    
    // Helper function to check household admin role
    function isHouseholdAdmin(householdId) {
      let memberDoc = get(/databases/$(database)/documents/household_members/$(request.auth.uid + '_' + householdId));
      return memberDoc.data.role == 'admin' || memberDoc.data.role == 'owner';
    }
    
    // Households - members can read, but only admins can write
    match /households/{householdId} {
      allow read: if request.auth != null && isInHousehold(householdId);
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && isHouseholdAdmin(householdId);
    }
    
    // Other collections follow similar patterns...
    match /financial_accounts/{docId} {
      allow read, write: if request.auth != null && isInHousehold(resource.data.household_id);
    }
    
    // Transactions - available to household members
    match /transactions/{transactionId} {
      allow read: if request.auth != null && 
                    exists(/databases/$(database)/documents/financial_accounts/$(resource.data.account_id)) &&
                    isInHousehold(get(/databases/$(database)/documents/financial_accounts/$(resource.data.account_id)).data.household_id);
      allow create: if request.auth != null && 
                    exists(/databases/$(database)/documents/financial_accounts/$(request.resource.data.account_id)) &&
                    isInHousehold(get(/databases/$(database)/documents/financial_accounts/$(request.resource.data.account_id)).data.household_id);
      allow update, delete: if request.auth != null && 
                    exists(/databases/$(database)/documents/financial_accounts/$(resource.data.account_id)) &&
                    isInHousehold(get(/databases/$(database)/documents/financial_accounts/$(resource.data.account_id)).data.household_id);
    }
  }
}
```

## Default Data Setup

When initializing your application, populate these default categories for each new household:

### Income Categories
- Salary
- Bonus
- Interest
- Investments
- Other Income

### Expense Categories
- Housing (Rent/Mortgage)
- Utilities
- Groceries
- Transportation
- Dining Out
- Entertainment
- Medical
- Insurance
- Debt Payments
- Savings
- Personal Care
- Education
- Shopping
- Travel
- Gifts
- Charitable Donations
- Miscellaneous 