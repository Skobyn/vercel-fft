'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/firebase-auth-provider';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  allowDemo?: boolean; // If true, will show a demo version instead of redirecting
}

export function ProtectedRoute({ 
  children, 
  fallback,
  allowDemo = true
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    // If just signed in, always show content
    const justSignedIn = typeof window !== 'undefined' && sessionStorage.getItem('just_signed_in');
    
    if (!loading) {
      if (isAuthenticated) {
        // User is authenticated, show content
        setShowContent(true);
        setIsDemoMode(false);
      } else if (justSignedIn) {
        // Just signed in but auth not confirmed yet, show content
        setShowContent(true);
        setIsDemoMode(false);
      } else if (allowDemo) {
        // Not authenticated but demo allowed, show demo content
        setShowContent(true);
        setIsDemoMode(true);
        toast.warning("You are viewing in demo mode. Some features may be limited.");
      } else {
        // Not authenticated and demo not allowed, redirect to login
        if (typeof window !== 'undefined') {
          // Use direct navigation for reliability
          window.location.href = '/auth/signin';
        }
      }
    }
  }, [loading, isAuthenticated, allowDemo]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show fallback if provided, otherwise nothing (redirect is happening)
  if (!showContent && fallback) {
    return <>{fallback}</>;
  }

  // Either show authenticated content or demo content
  return (
    <>
      {isDemoMode && (
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