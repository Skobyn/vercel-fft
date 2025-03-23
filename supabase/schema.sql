-- Create profiles table that extends the auth.users table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create households table for family sharing
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create household_members table to track members of households
CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID REFERENCES households(id) NOT NULL,
  profile_id UUID REFERENCES profiles(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (household_id, profile_id)
);

-- Create financial_accounts table to track bank accounts, credit cards, etc.
CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('checking', 'savings', 'credit', 'investment', 'loan', 'other')),
  balance DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  institution TEXT,
  account_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  plaid_account_id TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create categories table for transaction categorization
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  parent_id UUID REFERENCES categories(id),
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (household_id, name, parent_id)
);

-- Create transactions table for all financial transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES financial_accounts(id) NOT NULL,
  category_id UUID REFERENCES categories(id),
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  notes TEXT,
  date DATE NOT NULL,
  is_income BOOLEAN DEFAULT FALSE,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_split BOOLEAN DEFAULT FALSE,
  plaid_transaction_id TEXT,
  receipt_url TEXT,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create split_transactions table for transactions split between categories
CREATE TABLE IF NOT EXISTS split_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_transaction_id UUID REFERENCES transactions(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_period TEXT CHECK (recurrence_period IN ('monthly', 'quarterly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create budget_categories table to track category allocations in budgets
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID REFERENCES budgets(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (budget_id, category_id)
);

-- Create bills table for tracking recurring bills
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) NOT NULL,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  due_date DATE NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('one_time', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  category_id UUID REFERENCES categories(id),
  account_id UUID REFERENCES financial_accounts(id),
  auto_pay BOOLEAN DEFAULT FALSE,
  reminder_days INT DEFAULT 3,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'late')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create financial_goals table
CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES households(id) NOT NULL,
  name TEXT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  current_amount DECIMAL(12, 2) DEFAULT 0,
  target_date DATE,
  category_id UUID REFERENCES categories(id),
  account_id UUID REFERENCES financial_accounts(id),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create RLS policies to secure the data

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;

-- Create profile access policy
CREATE POLICY profile_access ON profiles
  FOR ALL USING (auth.uid() = id);

-- Create household policies 
CREATE POLICY household_member_access ON households
  FOR ALL USING (
    id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid()
    )
  );

-- Create household member access policy
CREATE POLICY member_access ON household_members
  FOR ALL USING (
    profile_id = auth.uid() OR 
    household_id IN (
      SELECT household_id FROM household_members 
      WHERE profile_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_profiles_modtime
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_households_modtime
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_financial_accounts_modtime
  BEFORE UPDATE ON financial_accounts
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_categories_modtime
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_transactions_modtime
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_split_transactions_modtime
  BEFORE UPDATE ON split_transactions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_budgets_modtime
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_budget_categories_modtime
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_bills_modtime
  BEFORE UPDATE ON bills
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_financial_goals_modtime
  BEFORE UPDATE ON financial_goals
  FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 