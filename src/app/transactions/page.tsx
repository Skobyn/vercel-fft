"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, FilterIcon, Search, Plus, ArrowUpDown, ChevronDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
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

type Transaction = {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  account: string;
};

export default function TransactionsPage() {
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Sample transaction data
  const transactions: Transaction[] = [
    {
      id: 1,
      date: "2025-03-22",
      description: "Grocery Store",
      category: "Food & Dining",
      amount: -120.45,
      account: "Chase Checking",
    },
    {
      id: 2,
      date: "2025-03-20",
      description: "Gas Station",
      category: "Transportation",
      amount: -45.67,
      account: "Bank of America Credit Card",
    },
    {
      id: 3,
      date: "2025-03-18",
      description: "Netflix",
      category: "Entertainment",
      amount: -15.99,
      account: "Wells Fargo Credit Card",
    },
    {
      id: 4,
      date: "2025-03-15",
      description: "Salary",
      category: "Income",
      amount: 2250.00,
      account: "Chase Checking",
    },
    {
      id: 5,
      date: "2025-03-14",
      description: "Restaurant",
      category: "Food & Dining",
      amount: -85.32,
      account: "Bank of America Credit Card",
    },
    {
      id: 6,
      date: "2025-03-12",
      description: "Internet Bill",
      category: "Bills & Utilities",
      amount: -69.99,
      account: "Wells Fargo Checking",
    },
    {
      id: 7,
      date: "2025-03-10",
      description: "Target",
      category: "Shopping",
      amount: -132.56,
      account: "Chase Credit Card",
    },
    {
      id: 8,
      date: "2025-03-08",
      description: "Side Project",
      category: "Income",
      amount: 350.00,
      account: "Chase Checking",
    },
    {
      id: 9,
      date: "2025-03-05",
      description: "Electric Bill",
      category: "Bills & Utilities",
      amount: -95.47,
      account: "Wells Fargo Checking",
    },
    {
      id: 10,
      date: "2025-03-01",
      description: "Mortgage",
      category: "Housing",
      amount: -1200.00,
      account: "Wells Fargo Checking",
    },
  ];

  // Get unique categories for the filter
  const categories = Array.from(new Set(transactions.map(t => t.category)));

  // Filter transactions based on search, category, and date
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchText === "" ||
      transaction.description.toLowerCase().includes(searchText.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchText.toLowerCase());

    const matchesCategory = selectedCategory === null || transaction.category === selectedCategory;

    const transactionDate = new Date(transaction.date);
    const matchesDateRange =
      (!dateRange?.from || transactionDate >= dateRange.from) &&
      (!dateRange?.to || transactionDate <= dateRange.to);

    return matchesSearch && matchesCategory && matchesDateRange;
  });

  // Sort transactions by date
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortDirection === "desc" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
  });

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
            <Select value={selectedCategory || ""} onValueChange={(value) => setSelectedCategory(value || null)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Transaction History</CardTitle>
              <div className="text-sm text-muted-foreground">
                {sortedTransactions.length} transactions
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
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
                {sortedTransactions.length > 0 ? (
                  sortedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{transaction.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </TableCell>
                      <TableCell>{transaction.account}</TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        transaction.amount > 0 ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {transaction.amount > 0 ? "+" : ""}
                        ${Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
