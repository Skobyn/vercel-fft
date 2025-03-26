"use client";

import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "./TransactionForm";
import { TransactionList, TransactionListRef } from "./TransactionList";
import { PlusCircle, List } from "lucide-react";

export default function TransactionsPage() {
  const [activeTab, setActiveTab] = useState("list");
  const transactionListRef = useRef<TransactionListRef>(null);
  
  // Function to handle successful transaction addition
  const handleTransactionAdded = () => {
    // Switch back to the transactions list
    setActiveTab("list");
    
    // Refresh the transaction list if possible
    if (transactionListRef.current?.fetchTransactions) {
      transactionListRef.current.fetchTransactions();
    }
  };
  
  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
              <p className="text-muted-foreground">
                View and manage your financial transactions
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="list" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-[300px]">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span>All Transactions</span>
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Add New</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-4">
              <TransactionList ref={transactionListRef} />
            </TabsContent>
            
            <TabsContent value="add" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>New Transaction</CardTitle>
                  <CardDescription>
                    Add a new transaction to your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TransactionForm onSuccess={handleTransactionAdded} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
