'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useFirestoreData } from '@/hooks/use-firebase';
import { useAuth } from '@/providers/firebase-auth-provider';
import { cn } from '@/lib/utils';

// Define the form schema
const formSchema = z.object({
  account_id: z.string({
    required_error: "Please select an account",
  }),
  category_id: z.string().optional(),
  amount: z.number({
    required_error: "Please enter an amount",
    invalid_type_error: "Please enter a number",
  }).positive(),
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  is_income: z.boolean().default(false),
});

type TransactionFormValues = z.infer<typeof formSchema>;

interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export function TransactionForm() {
  // Fetch accounts and categories
  const { data: accounts, loading: accountsLoading, fetchData: fetchAccounts } = useFirestoreData<Account>('financial_accounts');
  const { data: categories, loading: categoriesLoading, fetchData: fetchCategories } = useFirestoreData<Category>('categories');
  const { user } = useAuth();

  const [isIncome, setIsIncome] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  // Initialize form
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: 0,
      is_income: false,
      date: new Date(),
    },
  });

  // Filter categories based on whether it's income or expense
  const filteredCategories = categories?.filter(
    (category) => category.type === (isIncome ? 'income' : 'expense')
  );

  // Submit handler
  async function onSubmit(values: TransactionFormValues) {
    if (!user) {
      toast.error("You must be logged in to add transactions");
      return;
    }

    try {
      // Format the data for Firestore
      const transactionData = {
        ...values,
        amount: Number(values.amount),
        date: values.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        created_by: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Use the addDocument function from our hook
      const { addDocument } = useFirestoreData<any>('transactions');
      await addDocument(transactionData);

      toast.success("Transaction added successfully!");
      form.reset();
    } catch (error: any) {
      toast.error("Error adding transaction: " + error.message);
    }
  }

  if (accountsLoading || categoriesLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="is_income"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transaction Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const isIncome = value === 'income';
                    setIsIncome(isIncome);
                    field.onChange(isIncome);
                  }}
                  defaultValue={isIncome ? 'income' : 'expense'}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredCategories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Add Transaction</Button>
      </form>
    </Form>
  );
} 