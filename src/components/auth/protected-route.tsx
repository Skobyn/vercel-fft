'use client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// In full demo mode, we just render the children directly
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
} 