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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Handle auth state changes without redirections
  useEffect(() => {
    console.log("Initializing auth provider...");
    
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
        
        // Store auth info in localStorage
        localStorage.setItem('auth_user', JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          timestamp: Date.now(),
        }));
      } else {
        console.log("Clearing user state");
        setUser(null);
        localStorage.removeItem('auth_user');
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