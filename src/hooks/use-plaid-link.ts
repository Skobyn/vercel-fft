"use client";

import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink, PlaidLinkOnSuccessMetadata } from 'react-plaid-link';
import { toast } from 'sonner';
import { useAuth } from '@/providers/firebase-auth-provider';

interface UsePlaidLinkProps {
  onSuccess?: (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => void;
  onExit?: () => void;
}

export function usePlaidLinkFlow({ onSuccess, onExit }: UsePlaidLinkProps = {}) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch link token from our server when the component mounts
  const fetchLinkToken = useCallback(async () => {
    if (!user) {
      setError('You must be logged in to connect an account');
      return;
    }

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
  }, [user]);

  // Configure the Plaid Link
  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: (publicToken, metadata) => {
      // Exchange the public token for an access token
      exchangePublicToken(publicToken, metadata);

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
  const exchangePublicToken = async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
    if (!user) {
      setError('You must be logged in to connect an account');
      return;
    }

    try {
      const response = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          publicToken,
          institution: metadata.institution 
        }),
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
    if (!user) {
      setError('You must be logged in to connect an account');
      toast.error('Please log in to connect a financial account');
      return;
    }

    if (ready && linkToken) {
      open();
    } else if (!linkToken) {
      fetchLinkToken();
    }
  }, [ready, linkToken, open, fetchLinkToken, user]);

  // Fetch link token when the component mounts and user is available
  useEffect(() => {
    if (user) {
      fetchLinkToken();
    }
  }, [fetchLinkToken, user]);

  // Handle OAuth redirect if there's an oauth_state_id in the URL
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const query = new URLSearchParams(window.location.search);
      const oauthStateId = query.get('oauth_state_id');
      
      if (oauthStateId && linkToken) {
        // Resume the Link flow
        open();
        
        // Clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [open, linkToken, user]);

  return {
    startLinkFlow,
    isLoading,
    error,
    ready: ready && !!linkToken && !!user,
  };
}
