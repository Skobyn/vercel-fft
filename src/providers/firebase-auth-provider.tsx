'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { User as FirebaseUser } from 'firebase/auth';
import { User, mapFirebaseUser } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// To prevent redirect loops
let redirectInProgress = false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Handle auth state and redirects
  useEffect(() => {
    console.log("Initializing auth provider...");
    
    // Check if we're on an auth page
    const isAuthPage = window.location.pathname.startsWith('/auth');
    const isDashboardPage = window.location.pathname.startsWith('/dashboard');
    
    console.log("Current page:", {
      path: window.location.pathname,
      isAuthPage,
      isDashboardPage
    });
    
    if (typeof window === 'undefined' || !auth) {
      console.log("Auth provider: No window or auth object");
      setLoading(false);
      return;
    }

    console.log("Setting up auth state listener...");
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      console.log("Auth state changed:", firebaseUser ? "User present" : "No user");
      
      if (firebaseUser) {
        console.log("Setting user state with:", {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setUser(mapFirebaseUser(firebaseUser));
        
        // If on an auth page, redirect to dashboard
        if (isAuthPage && !redirectInProgress) {
          console.log("User is authenticated and on auth page, redirecting to dashboard");
          redirectInProgress = true;
          
          // Store auth info in localStorage
          localStorage.setItem('auth_user', JSON.stringify({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            timestamp: Date.now(),
          }));
          
          // Redirect to dashboard
          setTimeout(() => {
            window.location.replace('/dashboard');
          }, 100);
        }
      } else {
        console.log("Clearing user state");
        setUser(null);
        
        // If on a protected page, redirect to sign in
        if (!isAuthPage && isDashboardPage && !redirectInProgress) {
          console.log("User is not authenticated and on protected page, redirecting to sign in");
          redirectInProgress = true;
          localStorage.removeItem('auth_user'); // Clear auth data
          
          setTimeout(() => {
            window.location.replace('/auth/signin');
          }, 100);
        }
      }
      
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setLoading(false);
    });

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  console.log("Auth provider state:", { user: !!user, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 