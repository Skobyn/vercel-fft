'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// User type that maps Firebase user properties
export type User = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
};

// Fallback demo user (used only when auth fails)
const DEMO_USER: User = {
  id: 'demo-user-123',
  uid: 'demo-user-123',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: null
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserInfo: (userInfo: Partial<User>) => Promise<void>;
}

// Convert FirebaseUser to our User type
const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  uid: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || 'User',
  photoURL: firebaseUser.photoURL
});

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  demoMode: false,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateUserInfo: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const router = useRouter();

  // Listen for auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Function to load user profile from Firestore
    const loadUserProfile = async (firebaseUser: FirebaseUser) => {
      try {
        // First map basic Firebase user info
        const mappedUser = mapFirebaseUser(firebaseUser);
        
        // Then try to get additional profile info from Firestore
        if (db) {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Merge Firestore data with Firebase auth data
            Object.assign(mappedUser, {
              displayName: userData.displayName || mappedUser.displayName,
              photoURL: userData.photoURL || mappedUser.photoURL,
              // Add any other fields from Firestore
            });
          } else {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              email: mappedUser.email,
              displayName: mappedUser.displayName,
              photoURL: mappedUser.photoURL,
              createdAt: new Date().toISOString()
            });
          }
        }
        
        return mappedUser;
      } catch (error) {
        console.error("Error loading user profile:", error);
        return mapFirebaseUser(firebaseUser);
      }
    };
    
    if (typeof window !== 'undefined' && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        
        try {
          if (firebaseUser) {
            const userProfile = await loadUserProfile(firebaseUser);
            setUser(userProfile);
            setDemoMode(false);
            console.log("User authenticated:", userProfile.displayName);
            
            // Check if we need to redirect to dashboard
            const justSignedIn = sessionStorage.getItem('just_signed_in');
            if (justSignedIn === 'true') {
              console.log("Just signed in flag detected, redirecting to dashboard");
              sessionStorage.removeItem('just_signed_in');
              sessionStorage.removeItem('redirect_loop_blocker'); // Clear any redirect loop blockers
              
              // Use router for client-side navigation if we're not already on dashboard
              if (window.location.pathname !== '/dashboard') {
                router.push('/dashboard');
              }
            }
          } else {
            setUser(null);
            console.log("No user authenticated");
          }
        } catch (error) {
          console.error("Auth error:", error);
          // Fallback to demo mode in case of auth errors
          setUser(null);
        } finally {
          setLoading(false);
        }
      });
      
      // Cleanup subscription
      return () => unsubscribe();
    } else {
      setLoading(false);
      return () => {};
    }
  }, [router]);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      if (!auth) throw new Error('Firebase auth not initialized');
      
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, email, password);
      
      // Set flag that we just signed in to trigger redirect in auth state listener
      sessionStorage.setItem('just_signed_in', 'true');
      
      toast.success('Signed in successfully');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      if (!auth) throw new Error('Firebase auth not initialized');
      
      // Add debug logging
      console.log("Attempting Google sign-in...");
      console.log("Auth domain:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
      
      const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      
      // Add scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      // Use PopUp for debugging (easier to see errors)
      console.log("Opening Google auth popup...");
      
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("Google sign-in successful", result);
        const user = result.user;
        
        // Check if user document exists, create if not
        if (db) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
        
        // Set flag that we just signed in to trigger redirect in auth state listener
        sessionStorage.setItem('just_signed_in', 'true');
        
        toast.success('Signed in with Google successfully');
      } catch (popupError: any) {
        console.error("Popup error:", popupError);
        console.log("Trying redirect method instead...");
        
        // If popup fails, try redirect method
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          await signInWithRedirect(auth, provider);
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Google sign-in errors
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in cancelled. Please try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        toast.error('This domain is not authorized for authentication. Please contact support.');
        console.error('Unauthorized domain. Make sure your domain is added to the Firebase Auth providers.');
      } else {
        toast.error(error.message || 'Failed to sign in with Google');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      if (!auth) throw new Error('Firebase auth not initialized');
      
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateFirebaseProfile(result.user, {
        displayName
      });
      
      // Create user document in Firestore
      if (db) {
        await setDoc(doc(db, 'users', result.user.uid), {
          email,
          displayName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      toast.success('Account created successfully');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      if (!auth) throw new Error('Firebase auth not initialized');
      
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
      
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update user information
  const updateUserInfo = async (userInfo: Partial<User>) => {
    try {
      if (!user) throw new Error('No user is authenticated');
      if (!auth?.currentUser) throw new Error('Firebase user not available');
      
      // Update Firebase profile if needed
      if (userInfo.displayName || userInfo.photoURL) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: userInfo.displayName,
          photoURL: userInfo.photoURL
        });
      }
      
      // Update Firestore document
      if (db) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          ...userInfo,
          updatedAt: new Date().toISOString()
        });
      }
      
      // Update local state
      setUser(prev => prev ? { ...prev, ...userInfo } : null);
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  // Enable demo mode
  const enableDemoMode = () => {
    setUser(DEMO_USER);
    setDemoMode(true);
    toast.info('Demo mode activated');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoMode,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        updateUserInfo
      }}
    >
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