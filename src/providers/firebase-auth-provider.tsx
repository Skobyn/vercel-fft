'use client';

import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useFirebaseAuth } from '@/hooks/use-firebase';
import { User } from 'firebase/auth';
import { initializeUserData } from '@/utils/initializeDefaultData';

interface FirebaseAuthContextType {
  user: User | null;
  userProfile: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, userData: any) => Promise<User>;
  signOut: () => Promise<void>;
  updateProfile: (userId: string, profileData: any) => Promise<void>;
  initializeNewUser: (userId: string, householdName?: string) => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const auth = useFirebaseAuth();

  // Function to initialize a new user with default data
  const initializeNewUser = async (userId: string, householdName?: string) => {
    // Ensure this function doesn't fail when running on the server
    if (typeof window === 'undefined') {
      console.warn('initializeNewUser called on the server - deferring to client');
      return;
    }
    
    try {
      await initializeUserData(userId, householdName);
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  };

  // Enhanced sign up function that also initializes user data
  const enhancedSignUp = async (email: string, password: string, userData: any) => {
    const user = await auth.signUp(email, password, userData);
    await initializeNewUser(user.uid, userData.householdName);
    return user;
  };

  const enhancedAuth = {
    ...auth,
    signUp: enhancedSignUp,
    initializeNewUser
  };

  return <FirebaseAuthContext.Provider value={enhancedAuth}>{children}</FirebaseAuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider');
  }
  return context;
} 