"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/firebase-auth-provider";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AuthDebug() {
  const { user, loading } = useAuth();
  const [firebaseConfig, setFirebaseConfig] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Get Firebase config safely from environment variables
    setFirebaseConfig({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "Not set",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "Not set",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "Not set",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "Not set",
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert("Copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debug Panel</CardTitle>
        <CardDescription>Troubleshooting Firebase Authentication issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Firebase Configuration</h3>
          <div className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
            <pre>
              {JSON.stringify(firebaseConfig, null, 2)}
            </pre>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={() => copyToClipboard(JSON.stringify(firebaseConfig, null, 2))}
          >
            Copy Config
          </Button>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-medium mb-2">Authentication Status</h3>
          <div className="bg-muted p-4 rounded-md">
            {loading ? (
              <p>Loading authentication state...</p>
            ) : user ? (
              <div>
                <p className="text-green-600 font-medium">✅ Authenticated</p>
                <div className="mt-2">
                  <p><strong>User ID:</strong> {user.uid}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Display Name:</strong> {user.displayName}</p>
                  {user.photoURL && (
                    <div className="mt-2">
                      <p><strong>Profile Image:</strong></p>
                      <img 
                        src={user.photoURL} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full mt-1" 
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-red-600 font-medium">❌ Not authenticated</p>
            )}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-medium mb-2">Common Issues & Solutions</h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <strong>Unauthorized Domain:</strong> Make sure your current domain is added to the allowed domains in Firebase Console (Authentication → Settings → Authorized domains)
            </li>
            <li>
              <strong>Missing Config:</strong> Verify all environment variables are properly set
            </li>
            <li>
              <strong>Google Auth Provider:</strong> Ensure Google is enabled as a sign-in provider in Firebase Console (Authentication → Sign-in method)
            </li>
            <li>
              <strong>Popup Blocked:</strong> Check if your browser is blocking popups from this site
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </CardFooter>
    </Card>
  );
} 