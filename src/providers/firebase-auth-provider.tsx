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

  // Check for cached user when initializing
  useEffect(() => {
    // First check if we already have a cached user in localStorage
    // This gives us a faster initial state while waiting for Firebase
    console.log("Initial auth check");
    try {
      const storedUserData = localStorage.getItem('auth_user');
      if (storedUserData) {
        const storedUser = JSON.parse(storedUserData);
        // Only use if less than 24 hours old
        const timestamp = storedUser.timestamp || 0;
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          console.log("Using cached user from localStorage:", storedUser.email);
          // Create a temporary user object from localStorage data
          const tempUser = {
            ...storedUser,
            id: storedUser.uid,
            // Add required FirebaseUser properties
            emailVerified: false,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => { throw new Error('Not implemented'); },
            getIdToken: async () => '',
            getIdTokenResult: async () => ({ token: '' } as any),
            reload: async () => {},
            toJSON: () => ({}),
          } as unknown as User;
          
          setUser(tempUser);
        } else {
          console.log("Stored user data expired");
          localStorage.removeItem('auth_user');
        }
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
  }, []);

  // Handle Firebase auth state changes
  useEffect(() => {
    console.log("Initializing Firebase auth listener...");
    
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
        
        // Map the Firebase user to our User type
        const mappedUser = mapFirebaseUser(firebaseUser);
        setUser(mappedUser);
        
        // Store auth info in localStorage for persistence
        localStorage.setItem('auth_user', JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          timestamp: Date.now(),
        }));
      } else {
        console.log("No Firebase user found, clearing user state");
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