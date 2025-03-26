"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays, eachDayOfInterval, format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { cn } from "@/lib/utils";

interface CalendarHeatmapProps {
  expenses: Array<{
    date: string;
    amount: number;
  }>;
  month?: Date;
}

export function CalendarHeatmap({ expenses, month = new Date() }: CalendarHeatmapProps) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const dailySpending = useMemo(() => {
    const spending = new Map<string, number>();
    
    expenses.forEach(expense => {
      const date = format(new Date(expense.date), 'yyyy-MM-dd');
      spending.set(date, (spending.get(date) || 0) + expense.amount);
    });
    
    return spending;
  }, [expenses]);

  const maxSpending = useMemo(() => {
    let max = 0;
    dailySpending.forEach(amount => {
      if (amount > max) max = amount;
    });
    return max;
  }, [dailySpending]);

  const getIntensity = (amount: number) => {
    if (amount === 0) return 0;
    return Math.min(Math.ceil((amount / maxSpending) * 4), 4);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];

  // Add empty cells for days before the first of the month
  const firstDay = days[0].getDay();
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  // Add all days of the month
  days.forEach(day => {
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });

  // Add empty cells for days after the last of the month
  while (currentWeek.length < 7) {
    currentWeek.push(null);
  }
  weeks.push(currentWeek);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Activity</CardTitle>
        <CardDescription>
          Daily spending intensity for {format(month, 'MMMM yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-8 gap-2">
          {/* Week day labels */}
          <div className="h-10" /> {/* Empty cell for alignment */}
          {weekDays.map(day => (
            <div key={day} className="flex items-center justify-center h-10 text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Calendar grid */}
          {weeks.map((week, weekIndex) => (
            <>
              {/* Week number */}
              <div key={`week-${weekIndex}`} className="flex items-center justify-center h-10 text-sm font-medium text-muted-foreground">
                W{weekIndex + 1}
              </div>
              
              {/* Days */}
              {week.map((day, dayIndex) => {
                if (!day) return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-10" />;
                
                const dateStr = format(day, 'yyyy-MM-dd');
                const spending = dailySpending.get(dateStr) || 0;
                const intensity = getIntensity(spending);
                
                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "h-10 rounded-md flex items-center justify-center text-sm transition-colors",
                      intensity === 0 && "bg-secondary",
                      intensity === 1 && "bg-green-100 dark:bg-green-900/30",
                      intensity === 2 && "bg-green-200 dark:bg-green-800/40",
                      intensity === 3 && "bg-green-300 dark:bg-green-700/50",
                      intensity === 4 && "bg-green-400 dark:bg-green-600/60",
                    )}
                    title={`${format(day, 'MMM d')}: ${spending.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`}
                  >
                    {format(day, 'd')}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 4].map(intensity => (
            <div
              key={intensity}
              className={cn(
                "w-4 h-4 rounded",
                intensity === 0 && "bg-secondary",
                intensity === 1 && "bg-green-100 dark:bg-green-900/30",
                intensity === 2 && "bg-green-200 dark:bg-green-800/40",
                intensity === 3 && "bg-green-300 dark:bg-green-700/50",
                intensity === 4 && "bg-green-400 dark:bg-green-600/60",
              )}
            />
          ))}
          <span className="text-muted-foreground">More</span>
        </div>
      </CardContent>
    </Card>
  );
} 