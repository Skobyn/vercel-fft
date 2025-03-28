"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";

// Form validation schema
const accountFormSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  type: z.enum(["checking", "savings", "credit", "investment", "loan", "other"], {
    required_error: "Please select an account type",
  }),
  balance: z.coerce.number().default(0),
  currency: z.string().default("USD"),
  institution: z.string().optional(),
  account_number: z.string().optional(),
  is_active: z.boolean().default(true),
  is_default: z.boolean().default(false),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

// Account type definition (matching the one from the accounts page)
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

interface AccountFormProps {
  account?: Account;
  onSubmit: (values: Omit<Account, 'id'>) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function AccountForm({
  account,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AccountFormProps) {
  const [currentBalance, setCurrentBalance] = useState(account?.balance || 0);
  
  // Set default values from existing account or use defaults
  const defaultValues: Partial<AccountFormValues> = {
    name: account?.name || "",
    type: account?.type || "checking",
    balance: account?.balance || 0,
    currency: account?.currency || "USD",
    institution: account?.institution || "",
    account_number: account?.account_number || "",
    is_active: account?.is_active !== false,
    is_default: account?.is_default || false,
  };

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const handleBalanceChange = (value: string) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setCurrentBalance(numValue);
    form.setValue("balance", numValue);
  };

  // Handle form submission
  const handleSubmit = (values: AccountFormValues) => {
    onSubmit({
      ...values,
      balance: values.balance || 0,
    });
  };
  
  // Get current formatted balance for display
  const formattedBalance = formatCurrency(currentBalance);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Chase Checking" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="investment">Investment</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="balance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Balance</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={field.value}
                    onChange={(e) => handleBalanceChange(e.target.value)}
                  />
                </FormControl>
                <FormDescription>
                  {formattedBalance}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="institution"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Institution (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Chase Bank" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. **** 1234" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>
                  For your reference only. Use masked numbers for security.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col space-y-4">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Active Account</FormLabel>
                    <FormDescription>
                      Include this account in calculations and reports
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Default Account</FormLabel>
                    <FormDescription>
                      Use as default for new income and expenses
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : account
              ? "Update Account"
              : "Add Account"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
} 