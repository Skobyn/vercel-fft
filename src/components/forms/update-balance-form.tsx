"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

// Form schema for balance update
const formSchema = z.object({
  balance: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Please enter a valid positive number",
    }),
});

type UpdateBalanceFormProps = {
  onUpdate: (amount: number) => void;
  initialBalance?: number;
};

export default function UpdateBalanceForm({ onUpdate, initialBalance = 0 }: UpdateBalanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      balance: initialBalance > 0 ? initialBalance.toString() : "",
    },
    mode: "onChange",
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const amount = parseFloat(data.balance);
      await onUpdate(amount);
      form.reset({ balance: amount.toString() });
    } catch (error) {
      console.error("Error updating balance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <Wallet className="mr-2 h-5 w-5 text-primary" />
          Current Balance
        </CardTitle>
        <CardDescription>
          Set your current account balance to start tracking your finances
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Balance</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <Input
                        placeholder="0.00"
                        className="pl-7"
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Balance"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 