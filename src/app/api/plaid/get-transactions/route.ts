import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the access token from the request body
    const body = await request.json();
    const { accessToken, startDate, endDate } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      );
    }

    // Set default date range if not provided
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const formattedStartDate = startDate || oneMonthAgo.toISOString().split('T')[0];
    const formattedEndDate = endDate || now.toISOString().split('T')[0];

    // Get transactions
    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
    });

    const transactions = transactionsResponse.data.transactions;
    const accounts = transactionsResponse.data.accounts;

    return NextResponse.json({
      success: true,
      transactions,
      accounts,
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
