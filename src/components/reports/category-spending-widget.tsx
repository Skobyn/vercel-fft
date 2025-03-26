import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { formatCurrency } from "@/utils/financial-utils";

interface CategorySpendingWidgetProps {
  expenses: any[];
  categories: string[];
  defaultCategory?: string;
}

interface MonthlySpending {
  currentMonth: number;
  previousMonth: number;
  twoMonthsAgo: number;
  currentProgress: number;
}

export function CategorySpendingWidget({ expenses, categories, defaultCategory }: CategorySpendingWidgetProps) {
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory || categories[0]);
  const [spending, setSpending] = useState<MonthlySpending>({
    currentMonth: 0,
    previousMonth: 0,
    twoMonthsAgo: 0,
    currentProgress: 0
  });

  useEffect(() => {
    calculateSpending();
  }, [selectedCategory, expenses]);

  const calculateSpending = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgoStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Filter expenses by category and calculate totals
    const currentMonthTotal = expenses
      .filter(expense => 
        expense.category === selectedCategory &&
        new Date(expense.date) >= currentMonthStart &&
        new Date(expense.date) < now
      )
      .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

    const previousMonthTotal = expenses
      .filter(expense => 
        expense.category === selectedCategory &&
        new Date(expense.date) >= previousMonthStart &&
        new Date(expense.date) < currentMonthStart
      )
      .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

    const twoMonthsAgoTotal = expenses
      .filter(expense => 
        expense.category === selectedCategory &&
        new Date(expense.date) >= twoMonthsAgoStart &&
        new Date(expense.date) < previousMonthStart
      )
      .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);

    // Calculate progress through current month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const monthProgress = (dayOfMonth / daysInMonth) * 100;
    const expectedAmount = (previousMonthTotal / daysInMonth) * dayOfMonth;
    const currentProgress = expectedAmount > 0 ? (currentMonthTotal / expectedAmount) * 100 : 0;

    setSpending({
      currentMonth: currentMonthTotal,
      previousMonth: previousMonthTotal,
      twoMonthsAgo: twoMonthsAgoTotal,
      currentProgress
    });
  };

  const calculatePercentageChange = () => {
    if (spending.twoMonthsAgo === 0) return 0;
    return ((spending.previousMonth - spending.twoMonthsAgo) / spending.twoMonthsAgo) * 100;
  };

  const percentageChange = calculatePercentageChange();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Category Spending</CardTitle>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Previous Month Total</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {formatCurrency(spending.previousMonth)}
              </span>
              <div className={`flex items-center text-sm ${percentageChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {percentageChange >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                {Math.abs(percentageChange).toFixed(1)}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              vs. {new Date(new Date().setMonth(new Date().getMonth() - 2)).toLocaleDateString('en-US', { month: 'long' })}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Current Month Progress</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{formatCurrency(spending.currentMonth)}</span>
                <span className="text-sm text-muted-foreground">
                  {spending.currentProgress.toFixed(1)}% of last month's pace
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full ${
                    spending.currentProgress <= 100 ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, spending.currentProgress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 