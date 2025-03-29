"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, AlertCircle, Building, CreditCard, PiggyBank, Wallet, Landmark } from "lucide-react";

import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/providers/firebase-auth-provider";
import { db } from "@/lib/firebase-client";
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, orderBy, serverTimestamp, Timestamp } from "firebase/firestore";
import { AccountForm } from "@/components/forms/account-form";
import { formatCurrency } from "@/lib/utils";

// Account type definition
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'other';
  balance: number;
  currency: string;
  institution?: string;
  account_number?: string;
  is_active: boolean;
  plaid_account_id?: string;
  is_default?: boolean;
}

export default function AccountsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Fetch accounts when component mounts
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
      return;
    }

    if (user) {
      fetchAccounts();
    }
  }, [user, authLoading, router]);

  const fetchAccounts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get the user's household ID first
      const householdQuery = query(
        collection(db, "household_members"), 
        where("profile_id", "==", user.uid)
      );
      
      const householdSnapshot = await getDocs(householdQuery);
      
      if (householdSnapshot.empty) {
        toast.error("No household found for this user");
        setLoading(false);
        return;
      }
      
      const householdId = householdSnapshot.docs[0].data().household_id;
      
      // Then get accounts in that household using the nested collection path
      const accountsQuery = query(
        collection(db, `households/${householdId}/financial_accounts`),
        orderBy("name")
      );
      
      const accountsSnapshot = await getDocs(accountsQuery);
      
      const accountsList = accountsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Account[];
      
      setAccounts(accountsList);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (data: Omit<Account, 'id'>) => {
    if (!user) {
      console.error("Cannot add account: User not authenticated");
      toast.error("You must be logged in to add an account");
      return;
    }
    
    try {
      console.log("Starting account creation process...");
      
      // Get the user's household ID first
      const householdQuery = query(
        collection(db, "household_members"), 
        where("profile_id", "==", user.uid)
      );
      
      console.log("Fetching household for user:", user.uid);
      const householdSnapshot = await getDocs(householdQuery);
      
      if (householdSnapshot.empty) {
        console.error("No household found for user", user.uid);
        toast.error("No household found for this user");
        return;
      }
      
      const householdId = householdSnapshot.docs[0].data().household_id;
      console.log("Found household ID:", householdId);

      // Prepare the account data
      const accountData = {
        ...data,
        userId: user.uid,
        householdId: householdId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      
      console.log("Saving account data:", accountData);
      console.log("To collection path:", `households/${householdId}/financial_accounts`);

      // Add the new account using the nested collection path
      const docRef = await addDoc(collection(db, `households/${householdId}/financial_accounts`), accountData);
      
      console.log("Account created successfully with ID:", docRef.id);
      toast.success("Account added successfully");
      setIsAddDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      console.error("Error adding account:", error);
      toast.error("Failed to add account: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleEditAccount = async (data: Omit<Account, 'id'>) => {
    if (!user || !selectedAccount) return;
    
    try {
      // Get the user's household ID first
      const householdQuery = query(
        collection(db, "household_members"), 
        where("profile_id", "==", user.uid)
      );
      
      const householdSnapshot = await getDocs(householdQuery);
      
      if (householdSnapshot.empty) {
        toast.error("No household found for this user");
        return;
      }
      
      const householdId = householdSnapshot.docs[0].data().household_id;
      
      // Use the nested collection path
      const accountRef = doc(db, `households/${householdId}/financial_accounts`, selectedAccount.id);
      
      await updateDoc(accountRef, {
        ...data,
        updated_at: serverTimestamp(),
      });
      
      toast.success("Account updated successfully");
      setIsEditDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error("Failed to update account");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !selectedAccount) return;
    
    try {
      // Get the user's household ID first
      const householdQuery = query(
        collection(db, "household_members"), 
        where("profile_id", "==", user.uid)
      );
      
      const householdSnapshot = await getDocs(householdQuery);
      
      if (householdSnapshot.empty) {
        toast.error("No household found for this user");
        return;
      }
      
      const householdId = householdSnapshot.docs[0].data().household_id;
      
      // Use the nested collection path
      const accountRef = doc(db, `households/${householdId}/financial_accounts`, selectedAccount.id);
      
      await deleteDoc(accountRef);
      
      toast.success("Account deleted successfully");
      setIsDeleteDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <Building className="mr-2 h-5 w-5" />;
      case 'savings':
        return <PiggyBank className="mr-2 h-5 w-5" />;
      case 'credit':
        return <CreditCard className="mr-2 h-5 w-5" />;
      case 'investment':
        return <Landmark className="mr-2 h-5 w-5" />;
      default:
        return <Wallet className="mr-2 h-5 w-5" />;
    }
  };

  if (loading || authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <LoadingSpinner size="lg" message="Loading accounts..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
            <p className="text-muted-foreground">
              Manage your financial accounts
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Account</DialogTitle>
                <DialogDescription>
                  Add a new financial account to track your money
                </DialogDescription>
              </DialogHeader>
              <AccountForm onSubmit={handleAddAccount} onCancel={() => setIsAddDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="bank">Bank</TabsTrigger>
            <TabsTrigger value="credit">Credit</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.length === 0 ? (
                <Card className="col-span-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No accounts found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't added any financial accounts yet.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Your First Account
                  </Button>
                </Card>
              ) : (
                accounts.map((account) => (
                  <Card key={account.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {getAccountIcon(account.type)}
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                        </div>
                        <div>
                          {account.is_default && (
                            <Button variant="outline" size="sm" className="mr-2" disabled>
                              Default
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardDescription>
                        {account.institution || "No institution"} • {account.account_number || "No account number"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(account.balance)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-1 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedAccount(account);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="bank">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.filter(a => a.type === 'checking' || a.type === 'savings').length === 0 ? (
                <Card className="col-span-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No bank accounts found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't added any bank accounts yet.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>Add Bank Account</Button>
                </Card>
              ) : (
                accounts
                  .filter(a => a.type === 'checking' || a.type === 'savings')
                  .map((account) => (
                    <Card key={account.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          {getAccountIcon(account.type)}
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                        </div>
                        <CardDescription>
                          {account.institution || "No institution"} • {account.account_number || "No account number"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(account.balance)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-1 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="credit">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.filter(a => a.type === 'credit').length === 0 ? (
                <Card className="col-span-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No credit accounts found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't added any credit cards or credit accounts yet.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>Add Credit Account</Button>
                </Card>
              ) : (
                accounts
                  .filter(a => a.type === 'credit')
                  .map((account) => (
                    <Card key={account.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-5 w-5" />
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                        </div>
                        <CardDescription>
                          {account.institution || "No institution"} • {account.account_number || "No account number"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(account.balance)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Credit
                        </div>
                      </CardContent>
                      <CardFooter className="pt-1 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="other">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {accounts.filter(a => a.type !== 'checking' && a.type !== 'savings' && a.type !== 'credit').length === 0 ? (
                <Card className="col-span-full flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No other accounts found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You haven't added any investment, loan, or other account types yet.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>Add Other Account</Button>
                </Card>
              ) : (
                accounts
                  .filter(a => a.type !== 'checking' && a.type !== 'savings' && a.type !== 'credit')
                  .map((account) => (
                    <Card key={account.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center">
                          {getAccountIcon(account.type)}
                          <CardTitle className="text-lg">{account.name}</CardTitle>
                        </div>
                        <CardDescription>
                          {account.institution || "No institution"} • {account.account_number || "No account number"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {formatCurrency(account.balance)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-1 flex justify-between">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update your account details
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <AccountForm 
              account={selectedAccount} 
              onSubmit={handleEditAccount} 
              onCancel={() => setIsEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
} 