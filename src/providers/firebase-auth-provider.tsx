'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
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
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    // Add other properties as needed
  };
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

// Safe localStorage helper functions
const safeGetItem = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
      return true;
    }
    return false;
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
    return false;
  }
};

const safeRemoveItem = (key: string): boolean => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
      return true;
    }
    return false;
  } catch (e) {
    console.error(`Error removing ${key} from localStorage:`, e);
    return false;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Initialize auth state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    console.log("Auth provider initializing");
    
    // Try to restore user from localStorage first for faster initial state
    const savedUser = safeGetItem("authUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        console.log("User restored from localStorage");
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        safeRemoveItem("authUser");
      }
    }
    
    // Handle case where there's no window or auth object
    if (typeof window === 'undefined' || !auth) {
      console.log("Auth provider: No window or auth object");
      setLoading(false);
      return () => {};
    }
    
    // Set up Firebase auth state listener
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, 
      (authUser) => {
        console.log("Auth state changed:", authUser ? `user exists: ${authUser.email}` : "no user");
        
        if (authUser) {
          try {
            const mappedUser = mapFirebaseUserToUser(authUser);
            setUser(mappedUser);
            safeSetItem("authUser", JSON.stringify(mappedUser));
            console.log("User set from Firebase auth:", mappedUser.email);
          } catch (error) {
            console.error("Error mapping user:", error);
          }
        } else {
          setUser(null);
          safeRemoveItem("authUser");
          console.log("User cleared from state and localStorage");
        }
        
        // Set loading to false regardless of the auth state
        setLoading(false);
      }, 
      (error) => {
        console.error("Auth state change error:", error);
        // Set loading to false on error
        setLoading(false);
      }
    );

    // Return cleanup function to unsubscribe from auth listener
    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
    };
  }, []);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Auth provider state:", { 
      user: user ? `${user.email} (${user.id})` : 'null', 
      loading 
    });
  }, [user, loading]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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