"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetVisualizationProps {
  name: string;
  spent: number;
  budget: number;
  type?: "basic" | "bucket" | "envelope" | "gauge";
  icon?: React.ReactNode;
  category?: string;
  frequency?: string;
}

export function BudgetVisualization({
  name,
  spent,
  budget,
  type = "basic",
  icon,
  category = "",
  frequency = "monthly"
}: BudgetVisualizationProps) {
  const percentage = useMemo(() => Math.min(100, (spent / budget) * 100), [spent, budget]);
  const status = useMemo(() => {
    if (percentage >= 90) return "danger";
    if (percentage >= 75) return "warning";
    return "success";
  }, [percentage]);

  const remaining = budget - spent;

  const renderVisualization = () => {
    switch (type) {
      case "bucket":
        return (
          <div className="relative h-48 w-full flex items-center justify-center">
            <div className="relative w-32 h-32">
              {/* Bucket visualization based on provided design */}
              <div className="absolute inset-x-4 bottom-0 top-8 rounded-2xl border-2 border-primary/20 overflow-hidden">
                <div
                  className="absolute inset-x-0 bg-primary/20 transition-all duration-1000"
                  style={{ height: `${percentage}%`, bottom: 0 }}
                >
                  <div className="absolute inset-x-0 h-1 bg-primary/40 animate-wave" />
                </div>
              </div>
              <div className="absolute inset-x-2 top-4 h-4 rounded-full border-2 border-primary/20" />
              <div className="absolute inset-x-0 -top-2 h-12 border-t-2 border-primary/20 rounded-t-full" />
            </div>
          </div>
        );

      case "envelope":
        return (
          <div className="relative h-48 w-full flex items-center justify-center">
            <div className="relative w-48 h-32">
              {/* Envelope visualization based on provided design */}
              <div className="absolute inset-0 border-2 border-primary rounded-lg">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-primary/20 transition-all duration-1000"
                  style={{ height: `${percentage}%` }}
                />
              </div>
              <div
                className="absolute inset-x-0 top-0 border-b-[40px] border-l-[25px] border-r-[25px] border-primary transition-all duration-1000"
                style={{
                  transform: `rotateX(${Math.min(60, (percentage / 100) * 60)}deg)`,
                  transformOrigin: "top",
                }}
              />
            </div>
          </div>
        );

      case "gauge":
        return (
          <div className="relative h-48 w-full flex items-center justify-center">
            <div className="relative w-48 h-24">
              {/* Gauge visualization based on provided design */}
              <div className="absolute inset-x-0 bottom-0 h-full">
                <div className="relative h-full">
                  <div className="absolute inset-x-0 bottom-0 h-full rounded-t-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/20 to-red-400/20" />
                  </div>
                  <div
                    className="absolute bottom-0 left-1/2 h-1 w-12 bg-primary transform -translate-x-1/2 origin-bottom transition-all duration-1000"
                    style={{
                      transform: `rotate(${(percentage / 100) * 180 - 90}deg) translateX(-50%)`,
                    }}
                  >
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "basic":
      default:
        return (
          <div className="space-y-2">
            <Progress value={percentage} className={cn(
              "h-2",
              status === "danger" && "bg-red-100 dark:bg-red-900/20",
              status === "warning" && "bg-yellow-100 dark:bg-yellow-900/20",
              status === "success" && "bg-green-100 dark:bg-green-900/20"
            )} />
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1">
            <div className="font-semibold">{name}</div>
            {category && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                {category} ({frequency})
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderVisualization()}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Budget ({frequency})</span>
            <span className="font-medium">${budget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spent ({frequency})</span>
            <span className="font-medium">${spent.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{percentage}% spent</span>
            <span className="font-medium">${remaining.toLocaleString()} remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 