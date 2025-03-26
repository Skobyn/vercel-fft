"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isEqual, isSameDay, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Bill, Expense } from "@/types/financial";
import { AlertCircle, CheckCircle, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/financial-utils";
import { DayContent, DayProps } from "react-day-picker";

interface BillsCalendarProps {
  bills: Bill[];
  expenses: Expense[];
  onBillClick?: (bill: Bill) => void;
  onExpenseClick?: (expense: Expense) => void;
}

export function BillsCalendar({ bills, expenses, onBillClick, onExpenseClick }: BillsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Function to combine bills and expenses for a given day
  const getDayItems = (day: Date) => {
    const billsOnDay = bills.filter(bill => isSameDay(new Date(bill.dueDate), day));
    const expensesOnDay = expenses.filter(expense => isSameDay(new Date(expense.date), day));
    
    return {
      bills: billsOnDay,
      expenses: expensesOnDay,
      total: billsOnDay.length + expensesOnDay.length,
      amountDue: billsOnDay.reduce((sum, bill) => sum + bill.amount, 0),
      amountSpent: expensesOnDay.reduce((sum, expense) => sum + expense.amount, 0)
    };
  };

  // Create a custom day component for the calendar
  const CustomDay = (props: DayProps) => {
    if (!props.date) return null;
    
    const day = props.date;
    const { bills: billsOnDay, expenses: expensesOnDay, total, amountDue, amountSpent } = getDayItems(day);
    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
    const isCurrentMonth = isSameMonth(day, currentMonth);
    
    const hasOverdueBills = billsOnDay.some(bill => 
      !bill.isPaid && new Date(bill.dueDate) < new Date() && isSameDay(new Date(bill.dueDate), day)
    );
    
    return (
      <div 
        className={cn(
          "relative w-full h-full min-h-9 p-2",
          total > 0 && isCurrentMonth && "font-semibold",
          hasOverdueBills && isCurrentMonth && "bg-red-50 dark:bg-red-900/20"
        )}
      >
        <div className={cn(
          "h-7 w-7 p-0 font-normal flex items-center justify-center",
          isSelected && "bg-primary text-primary-foreground rounded-md"
        )}>
          {props.date.getDate()}
        </div>
        
        {total > 0 && isCurrentMonth && (
          <div className="absolute bottom-1 right-1">
            {amountDue > 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200">
                ${amountDue.toLocaleString()}
              </Badge>
            )}
            {amountSpent > 0 && amountDue === 0 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200">
                ${amountSpent.toLocaleString()}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          onMonthChange={setCurrentMonth}
          className="border rounded-md p-3"
          components={{
            Day: CustomDay
          }}
        />
      </div>

      {selectedDate && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">{format(selectedDate, "MMMM d, yyyy")}</h3>
            <div className="space-y-4">
              {getDayItems(selectedDate).bills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    Bills Due
                  </h4>
                  <div className="space-y-2">
                    {getDayItems(selectedDate).bills.map((bill) => (
                      <div 
                        key={bill.id} 
                        className={cn(
                          "p-3 rounded-md border flex justify-between items-center cursor-pointer hover:bg-accent",
                          bill.isPaid ? "bg-green-50 dark:bg-green-900/10 border-green-200" : 
                          isEqual(new Date(bill.dueDate), new Date()) || new Date(bill.dueDate) < new Date() 
                            ? "bg-red-50 dark:bg-red-900/10 border-red-200" 
                            : "bg-blue-50 dark:bg-blue-900/10 border-blue-200"
                        )}
                        onClick={() => onBillClick && onBillClick(bill)}
                      >
                        <div>
                          <div className="font-medium">{bill.name}</div>
                          <div className="text-sm text-muted-foreground">{bill.category}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-semibold">{formatCurrency(bill.amount)}</div>
                          {bill.isPaid && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getDayItems(selectedDate).expenses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                    Expenses
                  </h4>
                  <div className="space-y-2">
                    {getDayItems(selectedDate).expenses.map((expense) => (
                      <div 
                        key={expense.id} 
                        className="p-3 rounded-md border bg-green-50 dark:bg-green-900/10 border-green-200 flex justify-between items-center cursor-pointer hover:bg-accent"
                        onClick={() => onExpenseClick && onExpenseClick(expense)}
                      >
                        <div>
                          <div className="font-medium">{expense.name}</div>
                          <div className="text-sm text-muted-foreground">{expense.category}</div>
                        </div>
                        <div className="font-semibold">{formatCurrency(expense.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {getDayItems(selectedDate).total === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No bills or expenses for this day
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 