"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FilterIcon, Search, Plus, ArrowUpDown, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { ReceiptScanner } from "@/components/receipts/receipt-scanner";
import { TransactionForm } from './TransactionForm';
import { useFirestoreData } from '@/hooks/use-firebase';
import { useAuth } from '@/providers/firebase-auth-provider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, query, orderBy, where, getDocs, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

// Explicitly type db as Firestore or null to avoid type errors
const firebaseDb: Firestore | null = db as Firestore | null;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  is_income: boolean;
  category_id: string;
  account_id: string;
  category?: {
    name: string;
  };
  financial_account?: {
    name: string;
  };
}

export default function TransactionsPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: transactions, loading: transactionsLoading, fetchData } = useFirestoreData<Transaction>('transactions');
  const { data: accounts } = useFirestoreData<any>('financial_accounts');
  const { data: categories } = useFirestoreData<any>('categories');
  
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Load transactions when page loads
  useEffect(() => {
    if (user) {
      fetchData((ref) => {
        // Start with base query
        let q = query(ref, orderBy('date', sortDirection === 'asc' ? 'asc' : 'desc'));
        
        // Add filters
        if (selectedCategory) {
          q = query(q, where('category_id', '==', selectedCategory));
        }
        
        if (dateRange?.from) {
          const fromDate = dateRange.from.toISOString().split('T')[0];
          q = query(q, where('date', '>=', fromDate));
        }
        
        if (dateRange?.to) {
          const toDate = dateRange.to.toISOString().split('T')[0];
          q = query(q, where('date', '<=', toDate));
        }
        
        return q;
      });
    }
  }, [user, fetchData, sortDirection, selectedCategory, dateRange]);

  // Also load accounts and categories
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        // Explicitly handle the case where db might be undefined
        if (!firebaseDb) {
          console.error("Firebase database not initialized");
          return;
        }
        
        const q = query(collection(firebaseDb, 'financial_accounts'));
        const querySnapshot = await getDocs(q);
        // Data would be loaded via the useFirestoreData hook
      } catch (error) {
        console.error("Error fetching accounts:", error);
      }
    };
    
    const fetchCategories = async () => {
      try {
        // Explicitly handle the case where db might be undefined
        if (!firebaseDb) {
          console.error("Firebase database not initialized");
          return;
        }
        
        const q = query(collection(firebaseDb, 'categories'));
        const querySnapshot = await getDocs(q);
        // Data would be loaded via the useFirestoreData hook
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    
    if (user) {
      fetchAccounts();
      fetchCategories();
    }
  }, [user]);

  if (authLoading || transactionsLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Please sign in to view transactions</div>;
  }

  // Prepare data for display by joining with categories and accounts
  const preparedTransactions = transactions?.map(transaction => {
    // Find the category and account info
    const category = categories?.find(c => c.id === transaction.category_id);
    const account = accounts?.find(a => a.id === transaction.account_id);
    
    return {
      ...transaction,
      category: category ? { name: category.name } : { name: 'Uncategorized' },
      financial_account: account ? { name: account.name } : { name: 'Unknown Account' }
    };
  });

  // Get unique categories for the filter (using the already fetched categories)
  const categoryOptions = categories?.map(c => ({ id: c.id, name: c.name })) || [];

  // Filter transactions based on search text
  const filteredTransactions = preparedTransactions?.filter(transaction => {
    if (!searchText) return true;
    
    const searchLower = searchText.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(searchLower) ||
      transaction.category?.name.toLowerCase().includes(searchLower)
    );
  }) || [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
            <p className="text-muted-foreground">
              Manage and categorize all your financial activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReceiptScanner />
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="flex flex-1 items-center gap-2">
            <Select 
              value={selectedCategory || ""} 
              onValueChange={(value) => setSelectedCategory(value || null)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from && dateRange?.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    <span>Date Range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
                <div className="flex items-center justify-between border-t p-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(undefined)}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Get the last 30 days as default range
                      const to = new Date();
                      const from = new Date();
                      from.setDate(from.getDate() - 30);
                      setDateRange({ from, to });
                    }}
                  >
                    Last 30 Days
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortDirection(sortDirection === "desc" ? "asc" : "desc")}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">All Transactions</TabsTrigger>
            <TabsTrigger value="add">Add Transaction</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  View your recent financial activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>A list of your recent transactions.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No transactions found</TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{format(new Date(transaction.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>{transaction.category?.name || 'Uncategorized'}</TableCell>
                          <TableCell>{transaction.financial_account?.name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={transaction.is_income ? "secondary" : "default"}>
                              {transaction.is_income ? '+' : '-'} ${Math.abs(transaction.amount).toFixed(2)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle>Add Transaction</CardTitle>
                <CardDescription>
                  Record a new transaction in your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
