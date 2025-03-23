'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const { session, user, loading, signIn, signUp, signOut } = useSupabaseAuth();

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
} 