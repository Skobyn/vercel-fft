"use client";

import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOnSuccessMetadata } from 'react-plaid-link';
import { toast } from 'sonner';

interface UsePlaidLinkProps {
  onSuccess?: (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => void;
  onExit?: () => void;
}

export function usePlaidLinkFlow({ onSuccess, onExit }: UsePlaidLinkProps = {}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch link token from our server when the component mounts
  const fetchLinkToken = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create link token');
      }

      setLinkToken(data.linkToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to connect to financial services');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Configure the Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: (publicToken, metadata) => {
      // Exchange the public token for an access token
      exchangePublicToken(publicToken);

      // Call the optional onSuccess callback
      if (onSuccess) {
        onSuccess(publicToken, metadata);
      }
    },
    onExit: () => {
      // Call the optional onExit callback
      if (onExit) {
        onExit();
      }
    },
  });

  // Exchange the public token for an access token
  const exchangePublicToken = async (publicToken: string) => {
    try {
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ publicToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to exchange token');
      }

      toast.success('Account successfully connected!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to link account');
    }
  };

  // Start the Plaid Link flow
  const startLinkFlow = useCallback(() => {
    if (ready && linkToken) {
      open();
    } else if (!linkToken) {
      fetchLinkToken();
    }
  }, [ready, linkToken, open, fetchLinkToken]);

  // Fetch link token when the component mounts
  useEffect(() => {
    fetchLinkToken();
  }, [fetchLinkToken]);

  return {
    startLinkFlow,
    isLoading,
    error,
    ready: ready && !!linkToken,
  };
}
