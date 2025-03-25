"use client"

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FinancialProfile } from "@/types/financial";
import { formatCurrency } from "@/utils/financial-utils";

const balanceFormSchema = z.object({
  newBalance: z.coerce
    .number()
    .nonnegative("Balance must be non-negative"),
  reason: z.string().min(1, "Please provide a reason for the adjustment"),
});

type BalanceFormValues = z.infer<typeof balanceFormSchema>;

interface BalanceFormProps {
  profile: FinancialProfile | null;
  onSubmit: (values: BalanceFormValues) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export default function BalanceForm({
  profile,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: BalanceFormProps) {
  const currentBalance = profile?.currentBalance || 0;
  const currency = profile?.currency || "USD";

  const defaultValues: Partial<BalanceFormValues> = {
    newBalance: currentBalance,
    reason: "",
  };

  const form = useForm<BalanceFormValues>({
    resolver: zodResolver(balanceFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const handleSubmit = (values: BalanceFormValues) => {
    onSubmit(values);
  };

  const watchedBalance = form.watch("newBalance");
  const difference = watchedBalance - currentBalance;
  const isIncrease = difference > 0;
  const isDecrease = difference < 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div className="text-sm">
            Current Balance:{" "}
            <span className="font-semibold">
              {formatCurrency(currentBalance, currency)}
            </span>
          </div>

          <FormField
            control={form.control}
            name="newBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Balance</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => {
                      field.onChange(
                        e.target.value === "" ? 0 : parseFloat(e.target.value)
                      );
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {difference !== 0 && (
            <div className="text-sm">
              This is{" "}
              <span
                className={
                  isIncrease
                    ? "text-green-600 font-medium"
                    : isDecrease
                    ? "text-red-600 font-medium"
                    : ""
                }
              >
                {isIncrease ? "an increase" : "a decrease"} of{" "}
                {formatCurrency(Math.abs(difference), currency)}
              </span>{" "}
              from your current balance.
            </div>
          )}

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Adjustment</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Explain why you're adjusting your balance"
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  This helps you track why your balance changed over time.
                </FormDescription>
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
          <Button type="submit" disabled={isSubmitting || difference === 0}>
            {isSubmitting
              ? "Updating..."
              : difference === 0
              ? "No Change"
              : "Update Balance"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 