import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid-client';
import { CountryCode, Products } from 'plaid';
import { getCurrentUser } from '@/lib/firebase-client';

export async function POST() {
  try {
    // Check if user is authenticated via Firebase using getCurrentUser helper
    // This is safer for API routes than direct auth.currentUser access
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a client user ID based on the Firebase user ID
    const clientUserId = currentUser.uid;

    // Get the redirect URI from environment variable or use default
    const redirectUri = process.env.PLAID_REDIRECT_URI || 'http://localhost:3000/api/plaid/oauth-redirect';

    // Create a link token with the user's ID
    const createTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: clientUserId,
      },
      client_name: 'Financial Flow',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
      redirect_uri: redirectUri,
    });

    return NextResponse.json({ linkToken: createTokenResponse.data.link_token });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      { error: 'Failed to create link token', details: error.message },
      { status: 500 }
    );
  }
}
