"use client";

import { useState } from "react";
import { AuthDebug } from "@/components/auth/auth-debug";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/firebase-auth-provider";
import { LogIn } from "lucide-react";
import { db } from "@/lib/firebase-client";
import { addDoc, collection } from "firebase/firestore";
import { toast } from "sonner";

export default function AuthDebugPage() {
  const { signInWithGoogle, signOut, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

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
  
  const testFirestoreWrite = async () => {
    if (!user) {
      toast.error("You must be signed in to test database writes");
      return;
    }
    
    setIsTestingDb(true);
    try {
      // Try to write a test document to Firestore
      const testData = {
        userId: user.uid,
        text: "Test data",
        timestamp: new Date().toISOString()
      };
      
      console.log("Attempting to write test data to Firestore:", testData);
      const docRef = await addDoc(collection(db, "test_writes"), testData);
      console.log("Test write successful with document ID:", docRef.id);
      toast.success("Successfully wrote to Firestore!");
    } catch (err: any) {
      console.error("Firestore test write failed:", err);
      toast.error(`Failed to write to Firestore: ${err.message}`);
      setError(err.message || "Failed to write to database");
    } finally {
      setIsTestingDb(false);
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
          <LogIn className="h-4 w-4" />
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
      
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border my-8">
        <h2 className="text-xl font-semibold mb-4">Database Write Test</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          This test will attempt to write data to Firestore to verify your write permissions.
        </p>
        <Button 
          onClick={testFirestoreWrite} 
          disabled={isTestingDb || !user}
          className="w-full"
        >
          {isTestingDb ? 'Testing...' : 'Test Database Write'}
        </Button>
        <p className="mt-2 text-xs text-muted-foreground">
          Note: You must be signed in to test database writes.
        </p>
      </div>
      
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