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

  // Calculate the next occurrence based on frequency
  let nextDate = new Date(date);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
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
    case 'semiannually':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annually':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // If no recurrence, return the original date
      return date.toISOString();
  }

  // If the calculated date is still in the past, recursively calculate the next one
  if (nextDate <= now) {
    return calculateNextOccurrence(nextDate.toISOString(), frequency);
  }
  
  return nextDate.toISOString();
}

/**
 * Generates all future occurrences of a recurring item for the next specified days
 */
export function generateOccurrences<T extends { id: string; frequency: string; amount: number; endDate?: string }>(
  item: T, 
  dateField: keyof T, 
  days: number = 90
): Array<ForecastItem> {
  // For non-recurring items, just return the single occurrence
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
  
  // Set end date to now + days for the forecast period
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  // Start from the original date or calculate the next one if it's in the past
  let originalDate = new Date(item[dateField] as string);
  let currentDate: Date;
  
  // If the original date is in the past, find the next occurrence based on frequency
  if (originalDate < startDate) {
    // Calculate how many occurrences should have happened since the original date
    const timeDiff = startDate.getTime() - originalDate.getTime();
    let nextDate: Date;
    
    // Calculate the next occurrence after today based on frequency
    switch (item.frequency) {
      case 'daily': {
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        nextDate = new Date(originalDate);
        nextDate.setDate(nextDate.getDate() + daysDiff + 1);
        break;
      }
      case 'weekly': {
        const weeksDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
        nextDate = new Date(originalDate);
        nextDate.setDate(nextDate.getDate() + (weeksDiff + 1) * 7);
        break;
      }
      case 'biweekly': {
        const biweeksDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 14));
        nextDate = new Date(originalDate);
        nextDate.setDate(nextDate.getDate() + (biweeksDiff + 1) * 14);
        break;
      }
      case 'monthly': {
        // Get the day of month from original date
        const originalDay = originalDate.getDate();
        const monthsDiff = (startDate.getFullYear() - originalDate.getFullYear()) * 12 
                         + startDate.getMonth() - originalDate.getMonth();
        
        nextDate = new Date(originalDate);
        nextDate.setMonth(nextDate.getMonth() + monthsDiff + 1);
        
        // Handle month length issues (e.g., Jan 31 -> Feb 28)
        const maxDayInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(originalDay, maxDayInMonth));
        break;
      }
      case 'quarterly': {
        const quartersDiff = Math.floor((startDate.getFullYear() - originalDate.getFullYear()) * 4 
                           + (startDate.getMonth() - originalDate.getMonth()) / 3);
        nextDate = new Date(originalDate);
        nextDate.setMonth(nextDate.getMonth() + (quartersDiff + 1) * 3);
        break;
      }
      case 'semiannually': {
        const halfYearsDiff = Math.floor((startDate.getFullYear() - originalDate.getFullYear()) * 2 
                            + (startDate.getMonth() - originalDate.getMonth()) / 6);
        nextDate = new Date(originalDate);
        nextDate.setMonth(nextDate.getMonth() + (halfYearsDiff + 1) * 6);
        break;
      }
      case 'annually': {
        const yearsDiff = startDate.getFullYear() - originalDate.getFullYear();
        nextDate = new Date(originalDate);
        nextDate.setFullYear(nextDate.getFullYear() + yearsDiff + 1);
        break;
      }
      default:
        // Default to next day for unknown frequencies
        nextDate = new Date(startDate);
        nextDate.setDate(nextDate.getDate() + 1);
    }
    
    // Use the calculated next date as our starting point
    currentDate = nextDate;
  } else {
    // If original date is in the future, use it
    currentDate = new Date(originalDate);
  }
  
  // Safety counter to prevent infinite loops
  let safetyCounter = 0;
  const maxOccurrences = days >= 180 ? 100 : (days >= 90 ? 50 : 30); // More occurrences for longer forecasts
  
  // Generate occurrences until we reach the end date
  while (currentDate <= endDate && safetyCounter < maxOccurrences) {
    occurrences.push({
      itemId: item.id,
      date: currentDate.toISOString(),
      amount: item.amount,
      category: (item as any).category || 'unknown',
      name: (item as any).name || 'Unnamed Item',
      type: item.amount >= 0 ? 'income' : 'expense',
      description: `${(item as any).name || 'Unnamed Item'} (${(item as any).category || 'unknown'})${item.frequency !== 'once' ? ' - Recurring' : ''}`
    });
    
    // Calculate the next occurrence based on the frequency
    let nextDate = new Date(currentDate);
    
    switch (item.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly': {
        // Preserve the day of month where possible
        const originalDay = originalDate.getDate();
        nextDate.setMonth(nextDate.getMonth() + 1);
        
        // Handle month length issues (e.g., Jan 31 -> Feb 28)
        const maxDayInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(originalDay, maxDayInMonth));
        break;
      }
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semiannually':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annually':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        // For unsupported frequencies, just add 30 days
        nextDate.setDate(nextDate.getDate() + 30);
    }
    
    // Guard against dates not progressing (which would cause infinite loop)
    if (nextDate <= currentDate) {
      console.warn('Date not progressing in occurrence calculation, breaking loop');
      break;
    }
    
    currentDate = nextDate;
    safetyCounter++;
  }
  
  return occurrences;
}

/**
 * Generates a cash flow forecast for the specified number of days
 * with optimizations to prevent performance issues
 */
export function generateCashFlowForecast(
  currentBalance: number,
  incomes: Income[] = [],
  bills: Bill[] = [],
  expenses: Expense[] = [],
  balanceAdjustments: BalanceAdjustment[] = [],
  days: number = 90
): ForecastItem[] {
  try {
    // Normalize all inputs to prevent errors
    const normalizedBalance = isNaN(currentBalance) ? 0 : currentBalance;
    const normalizedDays = (!days || isNaN(days) || days <= 0 || days > 365) ? 90 : days;
    
    // Ensure arrays are valid and limit their size to prevent processing too much
    const validIncomes = Array.isArray(incomes) ? incomes.slice(0, 100) : [];
    const validBills = Array.isArray(bills) ? bills.slice(0, 100) : [];
    const validExpenses = Array.isArray(expenses) ? expenses.slice(0, 100) : [];
    const validAdjustments = Array.isArray(balanceAdjustments) ? balanceAdjustments.slice(0, 50) : [];
    
    console.log('Generating forecast with:', {
      balance: normalizedBalance,
      incomes: validIncomes.length,
      bills: validBills.length,
      expenses: validExpenses.length,
      adjustments: validAdjustments.length,
      days: normalizedDays
    });
    
    // Initialize forecast with current balance
    const forecast: ForecastItem[] = [{
      itemId: 'initial-balance',
      date: new Date().toISOString(),
      amount: normalizedBalance,
      category: 'balance',
      name: 'Current Balance',
      type: 'balance',
      runningBalance: normalizedBalance,
      description: 'Starting balance'
    }];
    
    // Function to safely add items to forecast
    const safelyAddItems = (
      items: any[], 
      processItem: (item: any) => ForecastItem | ForecastItem[] | null,
      itemType: string
    ) => {
      let processed = 0;
      
      for (const item of items) {
        try {
          const result = processItem(item);
          
          if (Array.isArray(result)) {
            forecast.push(...result);
            processed += result.length;
          } else if (result) {
            forecast.push(result);
            processed++;
          }
          
          // Performance safeguard: don't process too many items
          if (processed > 1000) {
            console.warn(`Processing limit reached for ${itemType}. Some items may be omitted.`);
            break;
          }
        } catch (error) {
          console.error(`Error processing ${itemType} item:`, error);
          // Skip this item and continue with others
        }
      }
    };
    
    // For forecast periods ≤ 30 days, use a simpler approach to prevent memory issues
    // Changed from 14 to 30 days to avoid crashes with 30-day forecasts
    const isShortForecast = normalizedDays <= 30;
    
    // Process incomes with proper recurring handling based on forecast length
    safelyAddItems(validIncomes, (income) => {
      // Only process valid income items
      if (!income.id || !income.date || isNaN(income.amount)) return null;
      
      // Always generate all occurrences for recurring items regardless of forecast length
      if (income.isRecurring && income.frequency) {
        return generateOccurrences(
          {
            ...income,
            id: income.id,
            frequency: income.frequency,
            amount: income.amount
          },
          'date',
          normalizedDays
        );
      }
      
      // For non-recurring items, just add the single occurrence if within forecast period
      const itemDate = new Date(income.date);
      const currentDate = new Date();
      const forecastEndDate = new Date();
      forecastEndDate.setDate(forecastEndDate.getDate() + normalizedDays);
      
      if (itemDate >= currentDate && itemDate <= forecastEndDate) {
        return {
          itemId: income.id,
          date: income.date,
          amount: income.amount,
          category: income.category || 'Income',
          name: income.name || 'Income',
          type: 'income',
          runningBalance: 0, // Will be calculated later
          description: `${income.name} (${income.category})`
        };
      }
      return null;
    }, 'income');
    
    // Process bills with proper recurring handling based on forecast length
    safelyAddItems(validBills, (bill) => {
      // Skip paid bills
      if (bill.isPaid) return null;
      
      // Only process valid bill items
      if (!bill.id || !bill.dueDate || isNaN(bill.amount)) return null;
      
      // Always generate all occurrences for recurring items regardless of forecast length
      if (bill.isRecurring && bill.frequency) {
        return generateOccurrences(
          {
            ...bill,
            id: bill.id,
            frequency: bill.frequency,
            amount: -Math.abs(bill.amount),
            date: bill.dueDate
          },
          'date',
          normalizedDays
        ).map(item => ({
          ...item,
          type: 'bill',
          description: `${bill.name} (${bill.category}) - Due${bill.autoPay ? ' - AutoPay' : ''}`
        }));
      }
      
      // For non-recurring bills, just add the single occurrence if within forecast period
      const dueDate = new Date(bill.dueDate);
      const currentDate = new Date();
      const forecastEndDate = new Date();
      forecastEndDate.setDate(forecastEndDate.getDate() + normalizedDays);
      
      if (dueDate >= currentDate && dueDate <= forecastEndDate) {
        return {
          itemId: bill.id,
          date: bill.dueDate,
          amount: -Math.abs(bill.amount), // Ensure bills are negative
          category: bill.category || 'Expense',
          name: bill.name || 'Bill',
          type: 'bill',
          runningBalance: 0, // Will be calculated later
          description: `${bill.name} (${bill.category}) - Due${bill.autoPay ? ' - AutoPay' : ''}`
        };
      }
      return null;
    }, 'bill');

    // Process expenses with similar recurring handling
    safelyAddItems(validExpenses, (expense) => {
      // Only process valid expense items
      if (!expense.id || !expense.date || isNaN(expense.amount)) return null;
      
      // Always generate all occurrences for recurring items regardless of forecast length
      if (expense.isRecurring && expense.frequency) {
        return generateOccurrences(
          {
            ...expense,
            id: expense.id,
            frequency: expense.frequency,
            amount: -Math.abs(expense.amount) // Ensure expenses are negative
          },
          'date',
          normalizedDays
        );
      }
      
      // For non-recurring expenses, just add the single occurrence if within forecast period
      const itemDate = new Date(expense.date);
      const currentDate = new Date();
      const forecastEndDate = new Date();
      forecastEndDate.setDate(forecastEndDate.getDate() + normalizedDays);
      
      if (itemDate >= currentDate && itemDate <= forecastEndDate) {
        return {
          itemId: expense.id,
          date: expense.date,
          amount: -Math.abs(expense.amount), // Ensure expenses are negative
          category: expense.category || 'Expense',
          name: expense.name || 'Expense',
          type: 'expense',
          runningBalance: 0, // Will be calculated later
          description: `${expense.name} (${expense.category})`
        };
      }
      return null;
    }, 'expense');
    
    // Process balance adjustments
    safelyAddItems(validAdjustments, (adjustment) => {
      if (!adjustment.id || !adjustment.date || isNaN(adjustment.amount)) return null;
      
      return {
        itemId: adjustment.id,
        date: adjustment.date,
        amount: adjustment.amount,
        category: 'adjustment',
        name: adjustment.reason || 'Balance Adjustment',
        type: 'adjustment',
        runningBalance: 0, // Will be calculated later
        description: `Balance adjusted by ${formatCurrency(adjustment.amount)} - ${adjustment.reason || 'No reason provided'}`
      };
    }, 'adjustment');
    
    // Sort by date
    forecast.sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } catch (error) {
        return 0; // Default to equal if error parsing dates
      }
    });
    
    // Limit the number of items for performance
    const maxItems = Math.min(forecast.length, 365); // Reasonable limit
    const trimmedForecast = forecast.slice(0, maxItems);
    
    // Calculate running balance in a single pass
    let runningBalance = normalizedBalance;
    for (let i = 0; i < trimmedForecast.length; i++) {
      const item = trimmedForecast[i];
      
      if (item.type === 'balance') {
        runningBalance = item.amount;
      } else if (!isNaN(item.amount)) {
        runningBalance += item.amount;
      }
      
      item.runningBalance = runningBalance;
    }
    
    console.log(`Generated forecast with ${trimmedForecast.length} items`);
    return trimmedForecast;
    
  } catch (error) {
    console.error('Critical error in generateCashFlowForecast:', error);
    // Return minimal valid forecast with the current balance
    return [{
      itemId: 'initial-balance',
      date: new Date().toISOString(),
      amount: isNaN(currentBalance) ? 0 : currentBalance,
      category: 'balance',
      name: 'Current Balance',
      type: 'balance',
      runningBalance: isNaN(currentBalance) ? 0 : currentBalance,
      description: 'Starting balance'
    }];
  }
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number): string {
  // Handle null, undefined, or NaN
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  
  // Round to exactly 2 decimal places
  const roundedAmount = Math.round(amount * 100) / 100;
  
  // Format with US currency format and force 2 decimal places
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(roundedAmount);
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

/**
 * Exports data to a CSV file
 * @param data Array of objects to export
 * @param fileName Name of the file to download
 */
export function exportToCSV(data: any[], fileName: string): void {
  // Get headers from first row
  const headers = Object.keys(data[0] || {});
  
  // Convert data to CSV rows
  const csvRows = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        // Handle values with commas by wrapping in quotes
        const value = row[header] === null || row[header] === undefined ? '' : row[header];
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ];
  
  // Create blob and download link
  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create temporary link and trigger download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses a CSV string into an array of objects
 * @param csvString The CSV string to parse
 * @returns Array of objects with headers as keys
 */
export function parseCSV(csvString: string): any[] {
  // Split into lines and handle empty input
  const lines = csvString.trim().split('\n');
  if (lines.length === 0) return [];
  
  // Parse headers from first line
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const obj: Record<string, any> = {};
    const values = parseCSVLine(lines[i]);
    
    if (values.length === headers.length) {
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = values[j] === '' ? null : values[j];
      }
      result.push(obj);
    }
  }
  
  return result;
}

/**
 * Parse a single CSV line, handling quoted values with commas
 * @param line CSV line to parse
 * @returns Array of values from the line
 */
function parseCSVLine(line: string): string[] {
  const result = [];
  let currentValue = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Check if this is an escaped quote
      if (i + 1 < line.length && line[i + 1] === '"') {
        currentValue += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of value
      result.push(currentValue);
      currentValue = '';
    } else {
      // Normal character
      currentValue += char;
    }
  }
  
  // Add the last value
  result.push(currentValue);
  
  return result;
}

/**
 * Normalizes a currency amount string to a number
 * Handles dollar signs, commas, spaces, etc.
 * @param amount The amount string to normalize
 * @returns A normalized number or NaN if invalid
 */
export function normalizeAmount(amount: string): number {
  if (!amount) return NaN;
  
  // Remove currency symbols, spaces, and other non-numeric characters except decimal points
  const cleanedAmount = amount.replace(/[^0-9.-]/g, '');
  
  // Parse the cleaned string to a number
  return parseFloat(cleanedAmount);
}

/**
 * Matches a category string to the closest valid category
 * Case-insensitive and handles singular/plural variations
 * @param categoryInput User input category
 * @param validCategories Array of valid categories
 * @returns The matched valid category or the first category if no match
 */
export function matchCategory(categoryInput: string, validCategories: string[]): string {
  if (!categoryInput || !validCategories.length) return validCategories[0] || '';
  
  // Normalize the input (lowercase, trim)
  const normalizedInput = categoryInput.toLowerCase().trim();
  
  // First try exact match (case insensitive)
  const exactMatch = validCategories.find(
    category => category.toLowerCase() === normalizedInput
  );
  if (exactMatch) return exactMatch;
  
  // Try singular/plural variations
  // If input ends with 's', try without it, or vice versa
  const singularPlural = normalizedInput.endsWith('s') 
    ? normalizedInput.slice(0, -1) 
    : normalizedInput + 's';
  
  const singularPluralMatch = validCategories.find(
    category => category.toLowerCase() === singularPlural
  );
  if (singularPluralMatch) return singularPluralMatch;
  
  // Try word matching - for compound words like "Car Payment" 
  // Look for categories that have all words from input or vice versa
  const inputWords = normalizedInput.split(/[\s\-_]+/);
  for (const category of validCategories) {
    const categoryWords = category.toLowerCase().split(/[\s\-_]+/);
    
    // Check if all input words are in the category
    const allWordsInCategory = inputWords.every(word => 
      categoryWords.some(catWord => catWord.includes(word) || word.includes(catWord))
    );
    
    // Special cases for common bill categories
    if (normalizedInput.includes('car') && normalizedInput.includes('payment') && 
        category.toLowerCase() === 'car payment') {
      return category;
    }
    
    if (normalizedInput.includes('debt') && 
        category.toLowerCase() === 'debt') {
      return category;
    }
    
    if (normalizedInput.includes('subscription') && 
        category.toLowerCase() === 'subscriptions') {
      return category;
    }
    
    if (allWordsInCategory) return category;
  }
  
  // Try fuzzy match - category that contains the input
  const fuzzyMatch = validCategories.find(
    category => category.toLowerCase().includes(normalizedInput) || 
                normalizedInput.includes(category.toLowerCase())
  );
  if (fuzzyMatch) return fuzzyMatch;
  
  // If no match so far, try to find partial matches
  for (const category of validCategories) {
    const lowerCategory = category.toLowerCase();
    
    // Check if the category contains any word from the input
    for (const word of inputWords) {
      if (word.length > 2 && lowerCategory.includes(word)) {
        return category;
      }
    }
  }
  
  // Default to the first category if no match
  return validCategories[0];
}

/**
 * Normalizes a frequency string to a valid frequency value
 * Handles case variations and common abbreviations
 * @param frequency The frequency string to normalize
 * @returns A normalized valid frequency value
 */
export function normalizeFrequency(frequency: string): string {
  if (!frequency) return 'once';
  
  const normalizedInput = frequency.toLowerCase().trim();
  
  // Direct matches
  const frequencyMap: Record<string, string> = {
    'once': 'once',
    'daily': 'daily',
    'weekly': 'weekly',
    'biweekly': 'biweekly',
    'bi-weekly': 'biweekly',
    'bi weekly': 'biweekly',
    'monthly': 'monthly',
    'quarterly': 'quarterly',
    'semiannually': 'semiannually',
    'semi-annually': 'semiannually',
    'semi annually': 'semiannually',
    'annually': 'annually',
    'yearly': 'annually'
  };
  
  // Check for direct match
  if (frequencyMap[normalizedInput]) {
    return frequencyMap[normalizedInput];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(frequencyMap)) {
    if (normalizedInput.includes(key) || key.includes(normalizedInput)) {
      return value;
    }
  }
  
  // Default to 'once' if no match
  return 'once';
} 