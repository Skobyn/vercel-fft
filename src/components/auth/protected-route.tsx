'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/firebase-auth-provider';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [showContent, setShowContent] = useState(false);

  // Check auth state and handle loading
  useEffect(() => {
    if (!loading) {
      setShowContent(true);
      
      // Show demo mode notification for non-authenticated users
      if (!user) {
        toast.warning("You are viewing in demo mode. Some features may be limited.");
      }
    }
  }, [user, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Show content (authenticated or demo mode)
  return (
    <>
      {!user && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-6">
          <h3 className="font-medium">Demo Mode Active</h3>
          <p className="text-sm mt-1">
            You are viewing in demo mode. Some features may be limited.
            <a
              href="/auth/signin"
              className="ml-2 underline font-medium"
            >
              Sign in
            </a>
            to access all features.
          </p>
        </div>
      )}
      {children}
    </>
  );
} 