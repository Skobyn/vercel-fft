"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/providers/firebase-auth-provider";
import { db } from "@/lib/firebase-client";
import { doc, getDoc, collection, query, where, getDocs, onSnapshot, Timestamp } from "firebase/firestore";

// Define the Household type
interface Household {
  id: string;
  name: string;
  created_by: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Define the HouseholdMember type
interface HouseholdMember {
  household_id: string;
  profile_id: string;
  role: "owner" | "admin" | "member";
  joined_at: Timestamp;
}

// Define the context value type
interface HouseholdContextType {
  household: Household | null;
  members: HouseholdMember[];
  isOwner: boolean;
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
  refreshHousehold: () => Promise<void>;
}

// Create the context
const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

// Provider component
export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch household data when the user changes
  useEffect(() => {
    if (!user) {
      setHousehold(null);
      setMembers([]);
      setIsOwner(false);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const fetchHouseholdData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query household_members to find the user's household
        const membershipsRef = collection(db, "household_members");
        const q = query(membershipsRef, where("profile_id", "==", user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          // User has no household yet
          setHousehold(null);
          setMembers([]);
          setLoading(false);
          return;
        }

        // Assuming a user belongs to just one household for now
        const memberDoc = querySnapshot.docs[0];
        const memberData = memberDoc.data() as HouseholdMember;
        const householdId = memberData.household_id;

        // Set role flags
        setIsOwner(memberData.role === "owner");
        setIsAdmin(memberData.role === "owner" || memberData.role === "admin");

        // Get the household details
        const householdRef = doc(db, "households", householdId);
        const householdDoc = await getDoc(householdRef);

        if (!householdDoc.exists()) {
          throw new Error("Household not found");
        }

        const householdData = householdDoc.data() as Household;
        setHousehold({ id: householdDoc.id, ...householdData });

        // Get all members of this household
        const allMembersRef = collection(db, "household_members");
        const membersQuery = query(allMembersRef, where("household_id", "==", householdId));
        const membersSnapshot = await getDocs(membersQuery);

        const allMembers = membersSnapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as HouseholdMember[];

        setMembers(allMembers);
      } catch (err) {
        console.error("Error fetching household:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };

    fetchHouseholdData();
  }, [user]);

  // Set up listeners for real-time updates to household data when household ID is available
  useEffect(() => {
    if (!household?.id || !user) return;

    // Listen for household changes
    const householdRef = doc(db, "households", household.id);
    const unsubscribeHousehold = onSnapshot(
      householdRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as Household;
          setHousehold({ id: doc.id, ...data });
        }
      },
      (err) => {
        console.error("Error in household listener:", err);
        setError(err);
      }
    );

    // Listen for member changes
    const membersRef = collection(db, "household_members");
    const membersQuery = query(membersRef, where("household_id", "==", household.id));
    const unsubscribeMembers = onSnapshot(
      membersQuery,
      (snapshot) => {
        const allMembers = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as HouseholdMember[];

        setMembers(allMembers);

        // Update role flags
        const userMember = allMembers.find((m) => m.profile_id === user.uid);
        if (userMember) {
          setIsOwner(userMember.role === "owner");
          setIsAdmin(userMember.role === "owner" || userMember.role === "admin");
        }
      },
      (err) => {
        console.error("Error in members listener:", err);
        setError(err);
      }
    );

    // Clean up listeners
    return () => {
      unsubscribeHousehold();
      unsubscribeMembers();
    };
  }, [household?.id, user]);

  // Function to manually refresh household data
  const refreshHousehold = async () => {
    if (!user || !household?.id) return;

    try {
      setLoading(true);
      
      // Refresh household data
      const householdRef = doc(db, "households", household.id);
      const householdDoc = await getDoc(householdRef);

      if (householdDoc.exists()) {
        const householdData = householdDoc.data() as Household;
        setHousehold({ id: householdDoc.id, ...householdData });
      }

      // Refresh members data
      const membersRef = collection(db, "household_members");
      const membersQuery = query(membersRef, where("household_id", "==", household.id));
      const membersSnapshot = await getDocs(membersQuery);

      const allMembers = membersSnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as HouseholdMember[];

      setMembers(allMembers);

      // Update role flags
      const userMember = allMembers.find((m) => m.profile_id === user.uid);
      if (userMember) {
        setIsOwner(userMember.role === "owner");
        setIsAdmin(userMember.role === "owner" || userMember.role === "admin");
      }
      
      setError(null);
    } catch (err) {
      console.error("Error refreshing household:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Create the context value
  const value = {
    household,
    members,
    isOwner,
    isAdmin,
    loading,
    error,
    refreshHousehold,
  };

  return <HouseholdContext.Provider value={value}>{children}</HouseholdContext.Provider>;
}

// Hook to use the household context
export function useCurrentHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useCurrentHousehold must be used within a HouseholdProvider");
  }
  return context;
}

// Export the provider and hook
export { HouseholdContext }; 