'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase-client';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { User, mapFirebaseUser } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

// Helper to map Firebase user to our User type
const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    // Add other properties as needed
  };
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initialized = useRef(false);

  // Initialize auth state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    console.log("Auth provider initializing");
    
    // Try to restore user from localStorage first for faster initial state
    const savedUser = localStorage.getItem("authUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        console.log("User restored from localStorage");
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        localStorage.removeItem("authUser");
      }
    }
    
    if (typeof window === 'undefined' || !auth) {
      console.log("Auth provider: No window or auth object");
      setLoading(false);
      return () => {};
    }
    
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, 
      (authUser) => {
        console.log("Auth state changed", authUser ? `user exists: ${authUser.email}` : "no user");
        
        if (authUser) {
          try {
            const mappedUser = mapFirebaseUserToUser(authUser);
            setUser(mappedUser);
            localStorage.setItem("authUser", JSON.stringify(mappedUser));
            console.log("User set from Firebase auth:", mappedUser.email);
          } catch (error) {
            console.error("Error mapping user:", error);
          }
        } else {
          setUser(null);
          localStorage.removeItem("authUser");
          console.log("User cleared from state and localStorage");
        }
        
        setLoading(false);
      }, 
      (error) => {
        console.error("Auth state change error:", error);
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  console.log("Auth provider state:", { 
    user: user ? `${user.email} (${user.id})` : 'null', 
    loading 
  });

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