"use client";

import * as React from "react";
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { format, subMonths } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  date: DateRange;
  onDateChange: (date: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  // Predefined date ranges
  const setDateRange = (range: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (range) {
      case "7d":
        onDateChange({
          from: subMonths(today, 0.25),
          to: today,
        });
        break;
      case "30d":
        onDateChange({
          from: subMonths(today, 1),
          to: today,
        });
        break;
      case "3m":
        onDateChange({
          from: subMonths(today, 3),
          to: today,
        });
        break;
      case "6m":
        onDateChange({
          from: subMonths(today, 6),
          to: today,
        });
        break;
      case "1y":
        onDateChange({
          from: subMonths(today, 12),
          to: today,
        });
        break;
      default:
        break;
    }
    
    setIsPopoverOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            size="sm"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex justify-between p-3 border-b">
            <Select
              onValueChange={(value) => setDateRange(value)}
              defaultValue="6m"
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (date?.from && date?.to) {
                    const diff = date.to.getTime() - date.from.getTime();
                    const newFrom = new Date(date.from.getTime() - diff);
                    const newTo = new Date(date.to.getTime() - diff);
                    onDateChange({
                      from: newFrom,
                      to: newTo
                    });
                  }
                }}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  if (date?.from && date?.to) {
                    const diff = date.to.getTime() - date.from.getTime();
                    const newFrom = new Date(date.from.getTime() + diff);
                    const newTo = new Date(date.to.getTime() + diff);
                    // Don't go beyond today
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    if (newTo <= today) {
                      onDateChange({
                        from: newFrom,
                        to: newTo
                      });
                    }
                  }
                }}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => {
              onDateChange(range || { from: undefined, to: undefined });
              if (range?.from && range?.to) {
                setIsPopoverOpen(false);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 