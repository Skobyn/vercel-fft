import { Bill, Expense, ForecastItem, Income } from "@/types/financial";

interface ForecastOptions {
  startDate: Date;
  days: number;
  startingBalance: number;
  incomes: Income[];
  bills: Bill[];
  expenses: Expense[];
}

/**
 * Generates a cash flow forecast for the specified number of days
 */
export function generateForecast(options: ForecastOptions): ForecastItem[] {
  const { startDate, days, startingBalance, incomes, bills, expenses } = options;
  
  // Start with initial balance
  const forecast: ForecastItem[] = [{
    itemId: 'initial-balance',
    date: startDate.toISOString(),
    amount: startingBalance,
    category: 'balance',
    name: 'Current Balance',
    type: 'balance',
    runningBalance: startingBalance,
    description: 'Starting balance'
  }];
  
  // Create a date for the end of the forecast period
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);
  
  // Add income items
  incomes.forEach(income => {
    if (!income.date) return;
    
    const incomeDate = new Date(income.date);
    if (incomeDate >= startDate && incomeDate <= endDate) {
      forecast.push({
        itemId: income.id,
        date: income.date,
        amount: income.amount,
        category: income.category || 'Income',
        name: income.name || 'Income',
        type: 'income',
        runningBalance: 0, // Will be calculated later
        description: `${income.name} (${income.category || 'Income'})`
      });
    }
  });
  
  // Add bill items
  bills.forEach(bill => {
    if (!bill.dueDate) return;
    
    const dueDate = new Date(bill.dueDate);
    if (dueDate >= startDate && dueDate <= endDate) {
      forecast.push({
        itemId: bill.id,
        date: bill.dueDate,
        amount: -Math.abs(bill.amount), // Bills are negative
        category: bill.category || 'Bill',
        name: bill.name || 'Bill',
        type: 'bill',
        runningBalance: 0, // Will be calculated later
        description: `${bill.name} (${bill.category || 'Bill'}) - Due`
      });
    }
  });
  
  // Add expense items
  expenses.forEach(expense => {
    if (!expense.date) return;
    
    const expenseDate = new Date(expense.date);
    if (expenseDate >= startDate && expenseDate <= endDate) {
      forecast.push({
        itemId: expense.id,
        date: expense.date,
        amount: -Math.abs(expense.amount), // Expenses are negative
        category: expense.category || 'Expense',
        name: expense.name || 'Expense',
        type: 'expense',
        runningBalance: 0, // Will be calculated later
        description: `${expense.name} (${expense.category || 'Expense'})`
      });
    }
  });
  
  // Sort by date
  forecast.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
  
  // Calculate running balance
  let runningBalance = startingBalance;
  forecast.forEach(item => {
    if (item.type === 'balance' && item.itemId === 'initial-balance') {
      // Initial balance item already has the correct value
      runningBalance = item.amount;
    } else {
      runningBalance += item.amount;
      item.runningBalance = runningBalance;
    }
  });
  
  return forecast;
} 