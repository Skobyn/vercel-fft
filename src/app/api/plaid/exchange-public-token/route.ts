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

    // Get the public token from the request body
    const body = await request.json();
    const { publicToken } = body;

    if (!publicToken) {
      return NextResponse.json(
        { error: 'Missing public token' },
        { status: 400 }
      );
    }

    // Exchange the public token for an access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // Here you would normally store the access token and item ID in your database
    // associated with the current user

    // For demo purposes, we're just returning success
    return NextResponse.json({
      success: true,
      message: 'Account successfully linked',
      itemId,
    });

  } catch (error) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    );
  }
}
