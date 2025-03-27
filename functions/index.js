const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { BigQuery } = require('@google-cloud/bigquery');
require('dotenv').config();

admin.initializeApp();
const bigquery = new BigQuery();

// Define the BigQuery dataset name
const BIGQUERY_DATASET = process.env.BIGQUERY_DATASET || 'family_finance_tracker';

/**
 * Cloud function to generate a financial forecast using BigQuery
 * This function queries financial data stored in BigQuery to calculate
 * a financial forecast over the specified number of days
 */
exports.generateForecast = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to generate a forecast.'
    );
  }

  const userId = context.auth.uid;
  const { daysToForecast = 30 } = data;

  try {
    console.log(`Generating ${daysToForecast}-day forecast for user ${userId}`);

    // Define your BigQuery query
    const query = `
      WITH current_balance AS (
        -- Get the user's current balance
        SELECT currentBalance 
        FROM \`${BIGQUERY_DATASET}.financialProfiles\` 
        WHERE userId = @userId
      ),
      
      future_incomes AS (
        -- Generate date arrays for recurring incomes
        SELECT 
          id, name, amount, date, frequency, category,
          GENERATE_DATE_ARRAY(
            DATE(date), 
            DATE_ADD(CURRENT_DATE(), INTERVAL @daysToForecast DAY), 
            CASE 
              WHEN frequency = 'weekly' THEN 7 
              WHEN frequency = 'biweekly' THEN 14
              WHEN frequency = 'monthly' THEN 30
              WHEN frequency = 'quarterly' THEN 90
              WHEN frequency = 'annually' THEN 365
              ELSE NULL
            END
          ) AS occurrence_dates
        FROM \`${BIGQUERY_DATASET}.incomes\`
        WHERE userId = @userId
          AND (frequency != 'once' OR DATE(date) > CURRENT_DATE())
      ),
      
      income_events AS (
        -- Flatten the date arrays into individual events
        SELECT
          id, name, amount, occurrence_date AS event_date, 'income' as type, category
        FROM future_incomes
        CROSS JOIN UNNEST(occurrence_dates) AS occurrence_date
        WHERE occurrence_date <= DATE_ADD(CURRENT_DATE(), INTERVAL @daysToForecast DAY)
      ),
      
      future_bills AS (
        -- Generate date arrays for recurring bills
        SELECT 
          id, name, amount * -1 AS amount, dueDate AS date, frequency, category,
          GENERATE_DATE_ARRAY(
            DATE(dueDate), 
            DATE_ADD(CURRENT_DATE(), INTERVAL @daysToForecast DAY), 
            CASE 
              WHEN frequency = 'weekly' THEN 7 
              WHEN frequency = 'biweekly' THEN 14
              WHEN frequency = 'monthly' THEN 30
              WHEN frequency = 'quarterly' THEN 90
              WHEN frequency = 'annually' THEN 365
              ELSE NULL
            END
          ) AS occurrence_dates
        FROM \`${BIGQUERY_DATASET}.bills\`
        WHERE userId = @userId
          AND isPaid = FALSE
          AND (frequency != 'once' OR DATE(dueDate) > CURRENT_DATE())
      ),
      
      bill_events AS (
        -- Flatten the date arrays into individual events
        SELECT
          id, name, amount, occurrence_date AS event_date, 'bill' as type, category
        FROM future_bills
        CROSS JOIN UNNEST(occurrence_dates) AS occurrence_date
        WHERE occurrence_date <= DATE_ADD(CURRENT_DATE(), INTERVAL @daysToForecast DAY)
      ),
      
      all_events AS (
        -- Combine income and bill events
        SELECT * FROM income_events
        UNION ALL
        SELECT * FROM bill_events
      ),
      
      daily_events AS (
        -- Group events by day
        SELECT
          event_date,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS daily_income,
          SUM(CASE WHEN type = 'bill' THEN amount ELSE 0 END) AS daily_expenses,
          SUM(amount) AS daily_net
        FROM all_events
        GROUP BY event_date
        ORDER BY event_date
      ),
      
      running_balance AS (
        -- Calculate running balance
        SELECT
          event_date,
          daily_income,
          daily_expenses,
          daily_net,
          SUM(daily_net) OVER (ORDER BY event_date) + 
            COALESCE((SELECT currentBalance FROM current_balance), 0) AS balance
        FROM daily_events
      )
      
      -- Return the final forecast
      SELECT 
        event_date,
        daily_income,
        daily_expenses,
        daily_net,
        balance
      FROM running_balance
      ORDER BY event_date
    `;

    // Set query parameters
    const options = {
      query: query,
      params: {
        userId: userId,
        daysToForecast: daysToForecast
      }
    };

    // Execute the query
    const [rows] = await bigquery.query(options);
    
    // Format the results
    const forecast = rows.map(row => ({
      date: row.event_date.value,
      income: parseFloat(row.daily_income),
      expenses: parseFloat(row.daily_expenses),
      netChange: parseFloat(row.daily_net),
      balance: parseFloat(row.balance),
    }));

    console.log(`Generated forecast with ${forecast.length} days`);
    return { forecast };
  } catch (error) {
    console.error('Error generating forecast:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate forecast',
      error.message
    );
  }
}); 