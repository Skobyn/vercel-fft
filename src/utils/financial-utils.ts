import { Income, Bill, Expense, Budget, ForecastItem, BalanceAdjustment } from '@/types/financial';

/**
 * Calculates the next occurrence of a date based on a recurrence pattern
 */
export function calculateNextOccurrence(startDate: string, frequency: string): string {
  const date = new Date(startDate);
  const now = new Date();
  
  // If the date is in the future, return it
  if (date > now) {
    return date.toISOString();
  }

  // Otherwise, calculate the next occurrence
  switch (frequency) {
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
    case 'semiannually':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      // If no recurrence, return the original date
      return date.toISOString();
  }

  return date.toISOString();
}

/**
 * Generates all future occurrences of a recurring item for the next specified days
 */
export function generateOccurrences<T extends { id: string; frequency: string; amount: number }>(
  item: T, 
  dateField: keyof T, 
  days: number = 90
): Array<ForecastItem> {
  if (!item.frequency || item.frequency === 'once') {
    return [{
      itemId: item.id,
      date: item[dateField] as string,
      amount: item.amount,
      category: (item as any).category || 'unknown',
      name: (item as any).name || 'Unnamed Item',
      type: item.amount >= 0 ? 'income' : 'expense'
    }];
  }

  const occurrences: ForecastItem[] = [];
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  let currentDate = new Date(item[dateField] as string);
  
  while (currentDate <= endDate) {
    occurrences.push({
      itemId: item.id,
      date: currentDate.toISOString(),
      amount: item.amount,
      category: (item as any).category || 'unknown',
      name: (item as any).name || 'Unnamed Item',
      type: item.amount >= 0 ? 'income' : 'expense'
    });
    
    currentDate = new Date(calculateNextOccurrence(currentDate.toISOString(), item.frequency));
  }
  
  return occurrences;
}

/**
 * Generates a cash flow forecast for the specified number of days
 */
export function generateCashFlowForecast(
  currentBalance: number,
  incomes: Income[],
  bills: Bill[],
  balanceAdjustments: BalanceAdjustment[] = [],
  days: number = 90
): ForecastItem[] {
  let forecast: ForecastItem[] = [];
  
  // Add initial balance as a forecast item
  forecast.push({
    itemId: 'initial-balance',
    date: new Date().toISOString(),
    amount: currentBalance,
    category: 'balance',
    name: 'Current Balance',
    type: 'balance'
  });
  
  // Process incomes
  incomes.forEach(income => {
    const occurrences = generateOccurrences(income, 'date', days);
    forecast = [...forecast, ...occurrences];
  });
  
  // Process bills
  bills.forEach(bill => {
    if (!bill.isPaid) {
      const occurrences = generateOccurrences(
        { ...bill, amount: -Math.abs(bill.amount) }, // Ensure bill amount is negative
        'dueDate', 
        days
      );
      forecast = [...forecast, ...occurrences];
    }
  });
  
  // Add balance adjustments
  balanceAdjustments.forEach(adjustment => {
    forecast.push({
      itemId: adjustment.id,
      date: adjustment.date,
      amount: adjustment.amount,
      category: 'adjustment',
      name: adjustment.reason || 'Balance Adjustment',
      type: 'adjustment'
    });
  });
  
  // Sort by date
  forecast.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate running balance
  let runningBalance = 0;
  forecast.forEach(item => {
    if (item.type === 'balance') {
      runningBalance = item.amount;
    } else {
      runningBalance += item.amount;
    }
    item.runningBalance = runningBalance;
  });
  
  return forecast;
}

/**
 * Formats a currency value
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Formats a date in a user-friendly format
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString);
  if (format === 'short') {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/**
 * Calculates budget utilization percentages
 */
export function calculateBudgetUtilization(budget: Budget, expenses: Expense[]): number {
  const relevantExpenses = expenses.filter(expense => 
    expense.category === budget.category &&
    new Date(expense.date) >= new Date(budget.startDate) &&
    new Date(expense.date) <= new Date(budget.endDate)
  );
  
  const totalSpent = relevantExpenses.reduce((total, expense) => total + expense.amount, 0);
  const percentage = (totalSpent / budget.amount) * 100;
  
  return Math.min(percentage, 100); // Cap at 100%
}

/**
 * Calculates goal progress percentage
 */
export function calculateGoalProgress(goal: { currentAmount: number; targetAmount: number }): number {
  if (goal.targetAmount <= 0) {
    return 0;
  }
  
  const percentage = (goal.currentAmount / goal.targetAmount) * 100;
  return Math.min(percentage, 100); // Cap at 100%
}

/**
 * Groups expenses by category and calculates totals
 */
export function groupExpensesByCategory(expenses: Expense[]): { category: string; total: number; count: number }[] {
  const grouped = expenses.reduce((acc, expense) => {
    const category = expense.category;
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += expense.amount;
    acc[category].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);
  
  return Object.entries(grouped).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count
  })).sort((a, b) => b.total - a.total);
}

/**
 * Calculates monthly spending trends
 */
export function calculateMonthlySpending(expenses: Expense[], months: number = 6): { month: string; total: number }[] {
  const now = new Date();
  const result: { month: string; total: number }[] = [];
  
  for (let i = 0; i < months; i++) {
    const targetMonth = new Date(now);
    targetMonth.setMonth(now.getMonth() - i);
    
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const monthEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
    
    const total = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    result.push({
      month: targetMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      total
    });
  }
  
  return result.reverse(); // Most recent last
}

/**
 * Determines if a date is upcoming based on days threshold
 */
export function isUpcoming(dateString: string, daysThreshold: number = 7): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= daysThreshold;
}

/**
 * Determines if a date is overdue
 */
export function isOverdue(dateString: string): boolean {
  const date = new Date(dateString);
  date.setHours(23, 59, 59, 999); // End of the day
  const now = new Date();
  
  return date < now;
}

/**
 * Gets upcoming bills
 */
export function getUpcomingBills(bills: Bill[], days: number = 7): Bill[] {
  return bills
    .filter(bill => !bill.isPaid && isUpcoming(bill.dueDate, days))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Gets overdue bills
 */
export function getOverdueBills(bills: Bill[]): Bill[] {
  return bills
    .filter(bill => !bill.isPaid && isOverdue(bill.dueDate))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

/**
 * Calculates days until a date
 */
export function daysUntil(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(diffDays, 0); // Don't return negative days
} 