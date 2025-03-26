'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { format } from "date-fns";
import { Edit, Trash2, ArrowUpRight, ArrowDownLeft, MoreVertical } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFirestoreData } from "@/hooks/use-firebase";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  account_id: string;
  category_id?: string;
  is_income: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

// Define the ref interface
export interface TransactionListRef {
  fetchTransactions: () => void;
}

export const TransactionList = forwardRef<TransactionListRef>((_, ref) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Fetch transactions from Firestore
  const { 
    data: transactions, 
    loading: transactionsLoading, 
    fetchData: fetchTransactions,
    deleteDocument
  } = useFirestoreData<Transaction>('transactions');
  
  // Fetch accounts and categories for display
  const { data: accounts } = useFirestoreData<Account>('financial_accounts');
  const { data: categories } = useFirestoreData<Category>('categories');
  
  // Expose the fetchTransactions method to the parent component
  useImperativeHandle(ref, () => ({
    fetchTransactions
  }));
  
  // Fetch data on component mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);
  
  // Sort transactions by date (most recent first)
  const sortedTransactions = transactions 
    ? [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  
  const getAccountName = (accountId: string) => {
    const account = accounts?.find(acc => acc.id === accountId);
    return account?.name || 'Unknown Account';
  };
  
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    const category = categories?.find(cat => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };
  
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await deleteDocument(deleteId);
        toast.success("Transaction deleted successfully");
        fetchTransactions(); // Refresh the transactions list
      } catch (error: any) {
        toast.error("Error deleting transaction: " + error.message);
      }
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };
  
  if (transactionsLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }
  
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">No transactions found.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add transactions using the form or connect your bank account.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          Your recent financial transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${transaction.is_income ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.is_income ? (
                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{transaction.description}</div>
                  <div className="text-sm text-muted-foreground flex gap-2">
                    <span>{getAccountName(transaction.account_id)}</span>
                    <span>•</span>
                    <span>{getCategoryName(transaction.category_id)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className={`font-medium ${transaction.is_income ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.is_income ? '+ ' : '- '}
                    {formatCurrency(transaction.amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(transaction.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this transaction. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}); 