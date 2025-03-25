'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase-client';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';

// Simple User type with minimal needed properties
type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Simple auth listener
  useEffect(() => {
    // Function to map Firebase user to our user type
    function mapUser(firebaseUser: FirebaseUser): User {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      };
    }
    
    // Skip if no window (SSR) or no auth
    if (typeof window === 'undefined' || !auth) {
      setLoading(false);
      return;
    }
    
    // Set up Firebase auth state listener
    const unsubscribe = onAuthStateChanged(
      auth,
      (authUser) => {
        if (authUser) {
          // User is signed in
          setUser(mapUser(authUser));
        } else {
          // User is signed out
          setUser(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Auth state change error:", error);
        setLoading(false);
      }
    );

    // Cleanup
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 