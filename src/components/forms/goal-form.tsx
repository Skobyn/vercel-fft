"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const goalFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  currentAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Must be a valid positive number",
  }),
  target: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Must be a valid positive number greater than 0",
  }),
  type: z.enum(["adventure", "envelope", "balloon", "jar"]).optional(),
  targetDate: z.string().optional(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  onSubmit: (data: GoalFormValues) => void;
  onCancel: () => void;
  initialData?: Partial<GoalFormValues>;
}

export function GoalForm({ onSubmit, onCancel, initialData }: GoalFormProps) {
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      category: initialData?.category || "",
      currentAmount: initialData?.currentAmount || "0",
      target: initialData?.target || "",
      type: initialData?.type || "jar",
      targetDate: initialData?.targetDate,
    },
    mode: "onChange",
  });

  const handleSubmit = (data: GoalFormValues) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <div>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Vacation Fund" {...field} />
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
              <FormLabel>Category (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Travel, Housing, Education" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="currentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Savings</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visualization Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a visualization type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="jar">Money Jar</SelectItem>
                  <SelectItem value="adventure">Adventure Map</SelectItem>
                  <SelectItem value="envelope">Savings Envelope</SelectItem>
                  <SelectItem value="balloon">Balloon</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose how you want to visualize your progress
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? "Update Goal" : "Create Goal"}
          </Button>
        </div>
      </form>
    </div>
  );
} 