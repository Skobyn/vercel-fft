import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid-client';
import { CountryCode, Products } from 'plaid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST() {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a client user ID - in a real app this would come from your database
    const clientUserId = 'user-' + Math.floor(Math.random() * 10000);

    // Create a link token with the user's ID
    const createTokenResponse = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: clientUserId,
      },
      client_name: 'Financial Flow',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return NextResponse.json({ linkToken: createTokenResponse.data.link_token });
  } catch (error) {
    console.error('Error creating link token:', error);
    return NextResponse.json(
      { error: 'Failed to create link token' },
      { status: 500 }
    );
  }
}
