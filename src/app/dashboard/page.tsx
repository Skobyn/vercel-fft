"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/firebase-auth-provider";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { IncomeList } from "@/components/dashboard/income-list";
import { BillsList } from "@/components/dashboard/bills-list";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SetupGuide } from "@/components/onboarding/setup-guide";
import { useFinancialProfile, useIncomes } from "@/hooks/use-financial-data";
import { FinancialProfile } from "@/types/financial";
import { ArrowRight, X } from "lucide-react";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { toast } from "sonner";
import { initializeCollections } from '@/utils/database-debug';
import { DebugPanel } from "@/components/dashboard/debug-panel";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading, updateBalance } = useFinancialProfile();
  const { incomes, loading: incomesLoading, error: incomesError, updateIncome, deleteIncome } = useIncomes();
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    console.log("Dashboard auth check - Loading:", loading, "User:", user ? "logged in" : "not logged in");
    
    // Wait for loading to complete before making decisions
    if (!loading) {
      if (!user) {
        console.log("User not authenticated, redirecting to sign in");
        
        // Check if we're in a potential redirect loop
        const redirectLoopBlocker = sessionStorage.getItem("redirect_loop_blocker");
        if (redirectLoopBlocker === "true") {
          console.log("Detected potential redirect loop, showing error instead of redirecting");
          toast.error("Authentication issue detected. Please try signing in again.");
          sessionStorage.removeItem("redirect_loop_blocker");
        } else {
          // Set redirect loop blocker and redirect
          sessionStorage.setItem("redirect_loop_blocker", "true");
          router.push("/auth/signin");
        }
      } else {
        console.log("User authenticated:", user.displayName);
        // Clear redirect loop blocker if user is authenticated
        sessionStorage.removeItem("redirect_loop_blocker");
        setAuthChecked(true);
        
        // If the user is new or doesn't have their collections initialized, initialize them
        initializeUserCollections(user.uid);
      }
    }
  }, [user, loading, router]);

  // Check if it's a new user to show setup guide
  useEffect(() => {
    if (user && profile && !profileLoading) {
      // Show setup guide for new users or if they haven't completed setup
      const isFirstVisit = !localStorage.getItem("has_visited_dashboard");
      const hasCompletedSetup = profile.hasCompletedSetup;
      
      if (isFirstVisit || !hasCompletedSetup) {
        setShowSetupGuide(true);
        localStorage.setItem("has_visited_dashboard", "true");
      }
    }
  }, [user, profile, profileLoading]);

  // Function to initialize necessary collections
  const initializeUserCollections = async (userId: string) => {
    if (!db) return;
    
    console.log("Ensuring collections are initialized for user:", userId);
    
    try {
      // Create financial profile if it doesn't exist yet
      const profileRef = doc(db, 'financialProfiles', userId);
      const profileSnap = await getDoc(profileRef);
      
      if (!profileSnap.exists()) {
        // Create default financial profile
        const defaultProfile: FinancialProfile = {
          userId,
          currentBalance: 0,
          lastUpdated: new Date().toISOString(),
          currency: 'USD',
          hasCompletedSetup: false
        };
        
        await setDoc(profileRef, defaultProfile);
        console.log("Created default financial profile");
      }
      
      // Create empty collections if they don't exist
      const collections = [
        { name: 'incomes', path: `users/${userId}/incomes` },
        { name: 'bills', path: `users/${userId}/bills` },
        { name: 'expenses', path: `users/${userId}/expenses` },
        { name: 'budgets', path: `users/${userId}/budgets` },
        { name: 'goals', path: `users/${userId}/goals` },
        { name: 'balanceAdjustments', path: `users/${userId}/balanceAdjustments` }
      ];
      
      // Create a placeholder document in each collection
      for (const collection of collections) {
        const placeholderRef = doc(db, collection.path, '_metadata');
        await setDoc(placeholderRef, { 
          created: new Date().toISOString(),
          note: 'This document ensures the collection exists'
        }, { merge: true });
        console.log(`Initialized collection: ${collection.name}`);
      }
    } catch (error) {
      console.error("Error initializing collections:", error);
    }
  };

  // Function to handle balance update
  const handleUpdateBalance = async (amount: number) => {
    try {
      await updateBalance(amount, "Initial setup");
      toast.success(`Balance updated to $${amount.toFixed(2)}`);
      // Mark that setup has begun but don't close the guide
      // Allow the user to continue with the next steps
    } catch (error) {
      console.error("Error updating balance:", error);
      toast.error("Failed to update balance");
    }
  };

  // Handle closing setup guide with transition
  const handleCloseSetupGuide = () => {
    // Set transitioning to prevent component thrashing
    setIsTransitioning(true);
    
    // Add small delay before changing state to avoid synchronous re-renders
    setTimeout(() => {
      setShowSetupGuide(false);
      
      // Add small delay before removing transition state
      setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // Adjust time as needed
    }, 100);
  };

  // Show loading state while checking authentication or loading profile
  if (loading || (!authChecked && !user)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <LoadingSpinner size="lg" message="Verifying authentication..." />
        </div>
      </MainLayout>
    );
  }

  // Show loading state while loading financial data
  if (profileLoading || incomesLoading || isTransitioning) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <LoadingSpinner size="lg" message="Loading your financial data..." />
        </div>
      </MainLayout>
    );
  }

  // This should never render due to the redirect in useEffect
  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Session expired</h2>
            <p className="mb-4">Your session has expired or you are not logged in.</p>
            <Button onClick={() => router.push("/auth/signin")}>
              Go to Sign In
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          
          {process.env.NODE_ENV !== 'production' && user && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const debugSection = document.getElementById('debug-section');
                if (debugSection) {
                  debugSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Debug Tools
            </Button>
          )}
        </div>
        
        {showSetupGuide ? (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Welcome to Achievr!</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseSetupGuide}
              >
                <X className="h-4 w-4 mr-2" />
                Close Setup Guide
              </Button>
            </div>
            <SetupGuide
              onClose={handleCloseSetupGuide}
              onSetBalance={handleUpdateBalance}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <BalanceCard onUpdateBalance={handleUpdateBalance} />
              <CashFlowChart />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IncomeList 
                incomes={incomes} 
                onEdit={updateIncome} 
                onDelete={deleteIncome}
                loading={incomesLoading}
                error={incomesError}
              />
              <BillsList />
            </div>
            
            <div className="mt-6 text-center">
              <Button 
                variant="outline" 
                onClick={() => setShowSetupGuide(true)}
                className="mx-auto"
              >
                Open Setup Guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {process.env.NODE_ENV !== 'production' && user && (
              <div id="debug-section">
                <DebugPanel userId={user.uid} />
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
