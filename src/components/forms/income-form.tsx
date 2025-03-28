"use client"

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format, addDays } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { INCOME_CATEGORIES, Income } from "@/types/financial";
import { formatCurrency } from "@/utils/financial-utils";
import { useAccounts } from "@/hooks/use-financial-data";
import { FinancialAccount } from "@/types/financial";

// Form schema
const incomeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be greater than 0")
    .nonnegative("Amount must be non-negative"),
  date: z.date({
    required_error: "Date is required",
  }),
  category: z.string().min(1, "Category is required"),
  frequency: z.enum([
    "once",
    "daily",
    "weekly", 
    "biweekly", 
    "monthly", 
    "quarterly", 
    "annually"
  ], {
    required_error: "Frequency is required",
  }),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  account_id: z.string().optional(),
});

type IncomeFormValues = z.infer<typeof incomeFormSchema>;

interface IncomeFormProps {
  income?: Income;
  onSubmit: (values: IncomeFormValues & { isRecurring: boolean }) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function IncomeForm({
  income,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: IncomeFormProps) {
  const [currentAmount, setCurrentAmount] = useState(income?.amount || 0);
  const { accounts, loading: loadingAccounts } = useAccounts();
  const [defaultAccount, setDefaultAccount] = useState<string | undefined>(undefined);
  
  // Set up the form with default values from the income object (if editing)
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      name: income?.name || "",
      amount: income?.amount || 0,
      date: income?.date ? new Date(income.date) : new Date(),
      category: income?.category || "Salary",
      frequency: income?.frequency || "monthly",
      notes: income?.notes || "",
      isRecurring: income?.isRecurring !== undefined ? income.isRecurring : false,
      account_id: income?.account_id || defaultAccount,
    },
    mode: "onChange",
  });

  // Find default account on load
  useEffect(() => {
    if (!income?.account_id && accounts && accounts.length > 0) {
      const defaultAcc = accounts.find(acc => acc.is_default);
      if (defaultAcc) {
        setDefaultAccount(defaultAcc.id);
        form.setValue('account_id', defaultAcc.id);
      } else if (accounts.length > 0) {
        setDefaultAccount(accounts[0].id);
        form.setValue('account_id', accounts[0].id);
      }
    }
  }, [accounts, income, form]);

  // Event handler for number input changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === "" ? 0 : parseFloat(value);
    setCurrentAmount(numValue);
    form.setValue("amount", numValue);
  };

  // Format the current amount for display
  const formattedAmount = formatCurrency(currentAmount);

  // Handle form submission
  const handleSubmit = (values: IncomeFormValues) => {
    // Set isRecurring based on frequency
    const isRecurring = values.frequency !== "once";
    
    onSubmit({
      ...values,
      isRecurring,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Income Name</FormLabel>
                <FormControl>
                  <Input placeholder="Salary, Freelance Work, etc" {...field} />
                </FormControl>
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
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    value={field.value}
                    onChange={handleAmountChange}
                  />
                </FormControl>
                <FormDescription>{formattedAmount}</FormDescription>
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
                        className={`w-full pl-3 text-left font-normal ${
                          !field.value ? "text-muted-foreground" : ""
                        }`}
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
                      disabled={(date) =>
                        date < addDays(new Date(), -90) // Can't pick dates more than 90 days in the past
                      }
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
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frequency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="once">One Time</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INCOME_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value || ""}
                  disabled={loadingAccounts}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingAccounts ? "Loading accounts..." : "Select account"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts?.map((account: FinancialAccount) => (
                      <SelectItem 
                        key={account.id} 
                        value={account.id}
                      >
                        {account.name} {account.is_default && "(Default)"}
                      </SelectItem>
                    ))}
                    {accounts?.length === 0 && (
                      <SelectItem value="" disabled>
                        No accounts available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional details..."
                  className="min-h-[80px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : income
              ? "Update Income"
              : "Add Income"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 