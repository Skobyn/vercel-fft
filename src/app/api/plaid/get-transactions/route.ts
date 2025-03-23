import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid-client';
import { auth } from '@/lib/firebase-client';
import { getPlaidToken, storePlaidTransactions } from '@/lib/plaid-firebase';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated via Firebase
    const currentUser = auth?.currentUser;
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const { itemId, startDate, endDate } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: 'Missing Plaid item ID' },
        { status: 400 }
      );
    }

    // Get the access token from Firestore
    const accessToken = await getPlaidToken(itemId);
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token not found for this item' },
        { status: 404 }
      );
    }

    // Set default date range if not provided
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const formattedStartDate = startDate || oneMonthAgo.toISOString().split('T')[0];
    const formattedEndDate = endDate || now.toISOString().split('T')[0];

    // Get transactions from Plaid
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
    });

    const transactions = transactionsResponse.data.transactions;
    const accounts = transactionsResponse.data.accounts;

    // Store transactions in Firestore
    await storePlaidTransactions(currentUser.uid, transactions);

    return NextResponse.json({
      success: true,
      transactions,
      accounts,
    });

  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message },
      { status: 500 }
    );
  }
}
