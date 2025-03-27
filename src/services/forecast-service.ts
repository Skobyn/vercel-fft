import { httpsCallable } from 'firebase/functions';
import { ForecastItem } from '@/types/financial';
import { functions } from '@/lib/firebase-client';

/**
 * Service for generating financial forecasts using BigQuery
 * This service calls the cloud function that performs the forecast calculations
 */

// Interface for forecast response
interface ForecastResponse {
  forecast: Array<{
    date: string;
    income: number;
    expenses: number;
    netChange: number;
    balance: number;
  }>;
}

/**
 * Fetches a financial forecast for the specified number of days
 * This calls the cloud function that uses BigQuery for forecasting
 */
export const getForecast = async (days: number = 30): Promise<ForecastItem[]> => {
  try {
    // Call the cloud function
    const generateForecast = httpsCallable<{ daysToForecast: number }, ForecastResponse>(
      functions, 
      'generateForecast'
    );
    
    console.log(`Requesting ${days}-day forecast from BigQuery`);
    const result = await generateForecast({ daysToForecast: days });
    
    // Convert the response to ForecastItem format
    return result.data.forecast.map(item => ({
      date: item.date,
      amount: item.netChange,
      balance: item.balance,
      runningBalance: item.balance,
      category: item.income > 0 ? 'income' : item.expenses < 0 ? 'expense' : 'balance',
      name: item.income > 0 ? 'Income' : item.expenses < 0 ? 'Expense' : 'Balance',
      type: item.income > 0 ? 'income' : item.expenses < 0 ? 'expense' : 'balance',
      itemId: `forecast-${item.date}`,
      // Additional data for tooltip/details
      dailyIncome: item.income,
      dailyExpenses: item.expenses
    }));
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
}; 