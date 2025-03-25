"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { initializeCollections } from "@/utils/database-debug";

interface DebugPanelProps {
  userId: string;
}

export function DebugPanel({ userId }: DebugPanelProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initResult, setInitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showIndexLinks, setShowIndexLinks] = useState(false);

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

  // IndexLinks component with all required index creation links
  const IndexLinks = () => (
    <div className="space-y-2 mt-4 pt-4 border-t">
      <h4 className="font-medium text-sm">Required Firebase Indexes</h4>
      <p className="text-xs text-muted-foreground mb-2">
        Click on each link to create the required indexes in Firebase Console
      </p>
      <div className="space-y-2">
        <a 
          href="https://console.firebase.google.com/v1/r/project/apex-family-finances-app/firestore/indexes?create_composite=Cllwcm9qZWN0cy9hcGV4LWZhbWlseS1maW5hbmNlcy1hcHAvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2V4cGVuc2VzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGggKBGRhdGUQAhoMCghfX25hbWVfXxAC" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-xs text-blue-600 hover:underline"
        >
          <LinkIcon className="h-3 w-3 mr-1" />
          Create index for expenses
        </a>
        <a 
          href="https://console.firebase.google.com/v1/r/project/apex-family-finances-app/firestore/indexes?create_composite=ClZwcm9qZWN0cy9hcGV4LWZhbWlseS1maW5hbmNlcy1hcHAvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2dvYWxzL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg4KCnRhcmdldERhdGUQARoMCghfX25hbWVfXxAB" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-xs text-blue-600 hover:underline"
        >
          <LinkIcon className="h-3 w-3 mr-1" />
          Create index for goals
        </a>
        <a 
          href="https://console.firebase.google.com/project/apex-family-finances-app/firestore/indexes" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-xs text-blue-600 hover:underline"
        >
          <LinkIcon className="h-3 w-3 mr-1" />
          Manage all Firestore indexes
        </a>
      </div>
    </div>
  );

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
        
        <div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowIndexLinks(!showIndexLinks)}
            className="w-full"
          >
            {showIndexLinks ? "Hide Index Links" : "Show Required Index Links"}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Links to create required Firestore indexes
          </p>
        </div>
        
        {showIndexLinks && <IndexLinks />}
      </div>
      
      <div className="mt-4 text-xs text-muted-foreground">
        <p>User ID: {userId}</p>
        <p className="mt-1">These tools are meant for development only.</p>
      </div>
    </div>
  );
} 