'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth } from '@/lib/firebase-client';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { User, mapFirebaseUser } from '@/types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
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
  isAuthenticated: false
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialized = useRef(false);
  const authCheckTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize auth state
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    console.log("Auth provider initializing");
    
    // Try to restore user from localStorage first for faster initial state
    const savedUser = safeGetItem("authUser");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log("User restored from localStorage:", parsedUser.email);
      } catch (error) {
        console.error("Failed to parse saved user:", error);
        safeRemoveItem("authUser");
      }
    }
    
    // Ensure loading state is properly handled even if Firebase is slow
    authCheckTimer.current = setTimeout(() => {
      if (loading) {
        console.log("Auth check timed out, assuming not authenticated");
        setLoading(false);
        setIsAuthenticated(false);
        setUser(null);
      }
    }, 5000); // 5 second timeout for auth check
    
    // Set up Firebase auth state listener
    if (typeof window === 'undefined' || !auth) {
      console.log("Auth provider: No window or auth object");
      setLoading(false);
      return () => {
        if (authCheckTimer.current) {
          clearTimeout(authCheckTimer.current);
        }
      };
    }
    
    console.log("Setting up auth state listener...");
    const unsubscribe = onAuthStateChanged(auth, 
      (authUser) => {
        // Clear the timeout since we got a response
        if (authCheckTimer.current) {
          clearTimeout(authCheckTimer.current);
          authCheckTimer.current = null;
        }
        
        console.log("Auth state changed:", authUser ? `user exists: ${authUser.email}` : "no user");
        
        if (authUser) {
          try {
            const mappedUser = mapFirebaseUserToUser(authUser);
            setUser(mappedUser);
            setIsAuthenticated(true);
            safeSetItem("authUser", JSON.stringify(mappedUser));
            
            console.log("User set from Firebase auth:", mappedUser.email);
          } catch (error) {
            console.error("Error mapping user:", error);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
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
        setIsAuthenticated(false);
        
        // Clear the timeout since we got a response (albeit an error)
        if (authCheckTimer.current) {
          clearTimeout(authCheckTimer.current);
          authCheckTimer.current = null;
        }
      }
    );

    // Return cleanup function to unsubscribe from auth listener
    return () => {
      console.log("Cleaning up auth state listener");
      unsubscribe();
      
      if (authCheckTimer.current) {
        clearTimeout(authCheckTimer.current);
        authCheckTimer.current = null;
      }
    };
  }, [loading]);

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Auth provider state:", { 
      user: user ? `${user.email} (${user.id})` : 'null', 
      loading,
      isAuthenticated
    });
  }, [user, loading, isAuthenticated]);

  // Handle redirect loop blocker for existing auth
  useEffect(() => {
    if (!loading && isAuthenticated && typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath.includes('/auth/');
      
      // If on auth page but already authenticated, redirect to dashboard (except if blocker exists)
      if (isAuthPage && !sessionStorage.getItem('redirect_loop_blocker')) {
        console.log("Already authenticated but on auth page, redirecting to dashboard");
        sessionStorage.setItem('redirect_loop_blocker', 'true');
        window.location.href = "/dashboard";
      }
    }
  }, [loading, isAuthenticated]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated }}>
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