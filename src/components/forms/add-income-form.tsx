"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

// Form schema for income
const formSchema = z.object({
  name: z.string().min(1, "Income name is required"),
  amount: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: "Amount must be a positive number",
  }),
  frequency: z.enum(["once", "weekly", "biweekly", "monthly", "yearly"], {
    required_error: "Please select a frequency",
  }),
  category: z.string().default("Salary"),
});

type AddIncomeFormProps = {
  onAddIncome: (data: any) => void;
};

export default function AddIncomeForm({ onAddIncome }: AddIncomeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      frequency: "monthly",
      category: "Salary",
    },
    mode: "onChange",
  });

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Format the data correctly for the API
      const formattedData = {
        name: data.name,
        amount: parseFloat(data.amount),
        date: new Date().toISOString(),
        frequency: data.frequency,
        isRecurring: data.frequency !== 'once',
        category: data.category,
        notes: '',
      };
      
      console.log('Submitting income with data:', formattedData);
      await onAddIncome(formattedData);
      console.log('Income added successfully');
      form.reset();
    } catch (error) {
      console.error("Error adding income:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <DollarSign className="mr-2 h-5 w-5 text-primary" />
          Add Income Source
        </CardTitle>
        <CardDescription>
          Record your regular income sources like salary, freelance work, etc.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Salary, Freelance, etc." {...field} />
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
            
            <FormField
              control={form.control}
              name="category"
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
                      <SelectItem value="Salary">Salary</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                      <SelectItem value="Investments">Investments</SelectItem>
                      <SelectItem value="Rental">Rental</SelectItem>
                      <SelectItem value="Gifts">Gifts</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Income Source"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 