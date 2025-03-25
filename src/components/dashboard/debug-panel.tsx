"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { initializeCollections } from "@/utils/database-debug";

interface DebugPanelProps {
  userId: string;
}

export function DebugPanel({ userId }: DebugPanelProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleInitializeCollections = async () => {
    setIsInitializing(true);
    setInitResult(null);
    
    try {
      toast.loading("Initializing collections...");
      await initializeCollections(userId);
      
      setInitResult({
        success: true,
        message: "Collections initialized successfully!"
      });
      
      toast.success("Collections initialized successfully! Refreshing...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Error initializing collections:", error);
      
      setInitResult({
        success: false,
        message: `Failed to initialize collections: ${error instanceof Error ? error.message : String(error)}`
      });
      
      toast.error("Failed to initialize collections");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleFirebaseRulesHelp = () => {
    toast.info(
      "Firebase Security Rules Setup",
      {
        description: "For this app to work properly, you need to set Firestore rules to allow authenticated users to access data. Follow these steps:\n\n1. Go to Firebase Console\n2. Open your project\n3. Go to Firestore Database\n4. Select 'Rules' tab\n5. Copy the rules from firestore.rules in your project\n6. Paste and publish the rules",
        duration: 10000,
      }
    );
  };

  return (
    <div className="p-4 my-6 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Developer Tools</h3>
      
      {initResult && (
        <Alert variant={initResult.success ? "default" : "destructive"} className="mb-4">
          {initResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>{initResult.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{initResult.message}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div>
          <Button 
            variant="outline" 
            size="sm"
            disabled={isInitializing}
            onClick={handleInitializeCollections}
            className="w-full"
          >
            Initialize User Collections
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Creates necessary Firestore collections for the current user
          </p>
        </div>
        
        <div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleFirebaseRulesHelp}
            className="w-full"
          >
            Firestore Rules Setup Help
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Get help with setting up proper Firebase security rules
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground">
        <p>User ID: {userId}</p>
        <p className="mt-1">These tools are meant for development only.</p>
      </div>
    </div>
  );
} 