import { NextRequest, NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid-client';
import { getCurrentUser } from '@/lib/firebase-client';
import { storePlaidToken } from '@/lib/plaid-firebase';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated via Firebase
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the public token from the request body
    const body = await request.json();
    const { publicToken, institution } = body;

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

    // Store the access token and item ID in Firestore
    await storePlaidToken(
      currentUser.uid,
      accessToken,
      itemId,
      institution?.name
    );

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account successfully linked',
      itemId,
    });

  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    return NextResponse.json(
      { error: 'Failed to exchange token', details: error.message },
      { status: 500 }
    );
  }
}
