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
  const [redirectCheckComplete, setRedirectCheckComplete] = useState(false);

  useEffect(() => {
    // Get special flags that help prevent redirect loops
    const justSignedIn = typeof window !== 'undefined' && sessionStorage.getItem('just_signed_in');
    const redirectLoopBlocker = typeof window !== 'undefined' && sessionStorage.getItem('redirect_loop_blocker');
    
    console.log("ProtectedRoute flags:", { 
      justSignedIn, 
      redirectLoopBlocker,
      isAuthenticated, 
      loading 
    });
    
    // Only process redirect after loading completes
    if (!loading) {
      // If we have loop blocker flag, always show content and clear it (one-time use)
      if (redirectLoopBlocker) {
        console.log("Redirect loop blocker active, showing content");
        setShowContent(true);
        setIsDemoMode(!isAuthenticated);
        
        if (!isAuthenticated && allowDemo) {
          toast.warning("You are viewing in demo mode. Some features may be limited.");
        }
        
        // Clear the flag after use
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('redirect_loop_blocker');
        }
      } 
      // If just signed in, show content regardless
      else if (justSignedIn) {
        console.log("Just signed in flag detected, showing content");
        setShowContent(true);
        setIsDemoMode(false);
      }
      // Standard authenticated flow
      else if (isAuthenticated) {
        console.log("User is authenticated, showing content");
        setShowContent(true);
        setIsDemoMode(false);
      } 
      // Allow demo mode if requested
      else if (allowDemo) {
        console.log("User not authenticated, showing demo mode");
        setShowContent(true);
        setIsDemoMode(true);
        toast.warning("You are viewing in demo mode. Some features may be limited.");
      } 
      // No authentication, no demo mode: redirect
      else {
        console.log("User not authenticated and demo mode not allowed, redirecting to login");
        if (typeof window !== 'undefined') {
          // Use direct navigation for reliability
          window.location.href = '/auth/signin';
        }
      }
      
      setRedirectCheckComplete(true);
    }
  }, [loading, isAuthenticated, allowDemo]);

  // Show loading state while checking authentication
  if (loading || !redirectCheckComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading...</p>
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