"use client"

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

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
import { Checkbox } from "@/components/ui/checkbox";
import { BILL_CATEGORIES } from "@/types/financial";
import { Bill } from "@/types/financial";
import { formatCurrency } from "@/utils/financial-utils";
import { useAccounts } from "@/hooks/use-financial-data";
import { FinancialAccount } from "@/types/financial";

const billFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.coerce
    .number()
    .min(0.01, "Amount must be greater than 0")
    .nonnegative("Amount must be non-negative"),
  category: z.string().min(1, "Category is required"),
  dueDate: z.date({
    required_error: "Due date is required",
  }),
  isPaid: z.boolean().default(false),
  frequency: z.string().min(1, "Frequency is required"),
  autoPay: z.boolean().default(false),
  notes: z.string().optional(),
  endDate: z.date().optional(),
  account_id: z.string().optional(),
  isRecurring: z.boolean().optional(),
});

type BillFormValues = z.infer<typeof billFormSchema>;

interface BillFormProps {
  bill?: Bill;
  onSubmit: (values: BillFormValues & { isRecurring: boolean }) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function BillForm({
  bill,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BillFormProps) {
  const isEditing = !!bill;
  const [currentAmount, setCurrentAmount] = useState(bill?.amount || 0);
  const { accounts, loading: loadingAccounts } = useAccounts();
  const [defaultAccount, setDefaultAccount] = useState<string | undefined>(undefined);

  const defaultValues: Partial<BillFormValues> = {
    name: bill?.name || "",
    amount: bill?.amount || 0,
    category: bill?.category || "",
    dueDate: bill?.dueDate ? new Date(bill.dueDate) : new Date(),
    isPaid: bill?.isPaid || false,
    frequency: bill?.frequency || "monthly",
    autoPay: bill?.autoPay || false,
    notes: bill?.notes || "",
    endDate: bill?.endDate ? new Date(bill.endDate) : undefined,
    account_id: bill?.account_id || defaultAccount,
    isRecurring: bill?.isRecurring,
  };

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Find default account on load
  useEffect(() => {
    if (!bill?.account_id && accounts && accounts.length > 0) {
      const defaultAcc = accounts.find(acc => acc.is_default);
      if (defaultAcc) {
        setDefaultAccount(defaultAcc.id);
        form.setValue('account_id', defaultAcc.id);
      } else if (accounts.length > 0) {
        setDefaultAccount(accounts[0].id);
        form.setValue('account_id', accounts[0].id);
      }
    }
  }, [accounts, bill, form]);

  // Event handler for number input changes
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === "" ? 0 : parseFloat(value);
    setCurrentAmount(numValue);
    form.setValue("amount", numValue);
  };

  // Format the current amount for display
  const formattedAmount = formatCurrency(currentAmount);

  const handleSubmit = (values: BillFormValues) => {
    // Auto-set isRecurring based on frequency
    const isRecurring = values.frequency !== 'once';
    
    // Include account_id in submission
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
                <FormLabel>Bill Name</FormLabel>
                <FormControl>
                  <Input placeholder="Rent, Electricity, etc" {...field} />
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
                    {...field}
                    onChange={handleAmountChange}
                  />
                </FormControl>
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
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BILL_CATEGORIES.map((category) => (
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
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Due Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className="w-full pl-3 text-left font-normal"
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
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("frequency") !== "once" && (
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>No end date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                        }}
                        disabled={(date) =>
                          date < form.getValues("dueDate") // Can't be before start date
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When this bill will stop recurring
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex items-center space-x-4 md:col-span-2">
            <FormField
              control={form.control}
              name="isPaid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Already Paid</FormLabel>
                    <FormDescription>
                      Mark this bill as already paid
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoPay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Auto Pay</FormLabel>
                    <FormDescription>
                      This bill is set up for automatic payment
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Additional information" {...field} />
                </FormControl>
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
              : isEditing
              ? "Update Bill"
              : "Add Bill"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 