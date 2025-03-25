"use client";

import { useState } from "react";
import { AuthDebug } from "@/components/auth/auth-debug";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/firebase-auth-provider";
import { Google } from "lucide-react";

export default function AuthDebugPage() {
  const { signInWithGoogle, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } catch (err: any) {
      setError(err.message || "Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10 space-y-8">
      <h1 className="text-3xl font-bold text-center">Firebase Authentication Debug</h1>
      
      <div className="flex justify-center gap-4 mb-8">
        <Button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Google className="h-4 w-4" />
          Sign In with Google
        </Button>
        
        <Button
          onClick={handleSignOut}
          disabled={isLoading}
          variant="outline"
        >
          Sign Out
        </Button>
      </div>
      
      {error && (
        <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-md text-red-700 mb-8">
          <p className="font-semibold">Authentication Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <AuthDebug />
      
      <div className="mt-10 text-center text-sm text-muted-foreground">
        <p>
          To add a domain to authorized domains in Firebase:
        </p>
        <ol className="list-decimal list-inside mt-2">
          <li>Go to the Firebase Console</li>
          <li>Select your project</li>
          <li>Go to Authentication → Settings → Authorized domains</li>
          <li>Click "Add domain" and add your current domain</li>
        </ol>
      </div>
    </div>
  );
} 