'use client';

import { createContext, useContext, useState } from 'react';

// Demo user type
export type User = {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
};

// Create a demo user
const DEMO_USER: User = {
  id: 'demo-user-123',
  uid: 'demo-user-123',
  email: 'demo@example.com',
  displayName: 'Demo User',
  photoURL: null
};

interface AuthContextType {
  user: User;
  loading: boolean;
  updateUserInfo: (userInfo: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: DEMO_USER,
  loading: false,
  updateUserInfo: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Always use the demo user
  const [user, setUser] = useState<User>(DEMO_USER);
  const [loading, setLoading] = useState(false);

  // Function to update demo user information
  const updateUserInfo = (userInfo: Partial<User>) => {
    setUser(prev => ({
      ...prev,
      ...userInfo
    }));
  };

  console.log("Demo mode active - using demo user:", user.displayName);

  return (
    <AuthContext.Provider value={{ user, loading, updateUserInfo }}>
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