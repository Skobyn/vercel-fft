"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface BudgetVisualizationProps {
  spent: number;
  budget: number;
  name: string;
  type?: 'bucket' | 'envelope' | 'gauge' | 'fill';
}

export function BudgetVisualization({ spent, budget, name, type = 'fill' }: BudgetVisualizationProps) {
  const percentage = useMemo(() => {
    return Math.min((spent / budget) * 100, 100);
  }, [spent, budget]);

  const status = useMemo(() => {
    if (percentage >= 100) return 'danger';
    if (percentage >= 80) return 'warning';
    return 'success';
  }, [percentage]);

  if (type === 'bucket') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>
            {spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {budget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-40 w-full">
            {/* Bucket container */}
            <div className="absolute inset-x-0 bottom-0 h-32 border-b-2 border-x-2 rounded-b-lg border-primary">
              {/* Water fill */}
              <div 
                className={cn(
                  "absolute bottom-0 left-0 right-0 transition-all duration-500",
                  status === 'danger' && "bg-red-500/20",
                  status === 'warning' && "bg-yellow-500/20",
                  status === 'success' && "bg-blue-500/20"
                )}
                style={{ height: `${percentage}%` }}
              >
                {/* Water waves effect */}
                <div className="absolute inset-0 opacity-50">
                  <div className="absolute inset-0 animate-wave" 
                    style={{
                      background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                      animation: "wave 2s linear infinite",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'envelope') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>
            {spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {budget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-32 w-full">
            {/* Envelope */}
            <div 
              className={cn(
                "absolute inset-0 border-2 rounded-lg transition-all duration-500",
                status === 'danger' && "border-red-500 bg-red-500/10",
                status === 'warning' && "border-yellow-500 bg-yellow-500/10",
                status === 'success' && "border-primary bg-primary/5"
              )}
              style={{
                transform: `scale(${1 + (percentage / 200)})`,
              }}
            >
              {/* Envelope flap */}
              <div 
                className={cn(
                  "absolute inset-x-0 top-0 h-8 transition-all duration-500",
                  status === 'danger' && "border-red-500",
                  status === 'warning' && "border-yellow-500",
                  status === 'success' && "border-primary"
                )}
                style={{
                  borderBottom: '2px solid',
                  transform: `rotateX(${percentage > 80 ? 45 : 0}deg)`,
                  transformOrigin: 'top',
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'gauge') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>
            {spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {budget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-32">
            {/* Gauge background */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-secondary rounded-t-full overflow-hidden">
              {/* Gauge fill */}
              <div 
                className={cn(
                  "absolute bottom-0 left-0 h-full transition-all duration-500 rounded-t-full",
                  status === 'danger' && "bg-red-500",
                  status === 'warning' && "bg-yellow-500",
                  status === 'success' && "bg-green-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {/* Gauge needle */}
            <div 
              className="absolute bottom-0 left-1/2 h-16 w-1 bg-foreground origin-bottom transition-all duration-500"
              style={{ transform: `rotate(${(percentage * 1.8) - 90}deg)` }}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default fill visualization
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>
          {spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {budget.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className={cn(
              "h-4 transition-colors",
              status === 'danger' && "bg-red-100 dark:bg-red-900/20",
              status === 'warning' && "bg-yellow-100 dark:bg-yellow-900/20",
              status === 'success' && "bg-green-100 dark:bg-green-900/20"
            )}
            style={{
              '--progress-background': cn(
                status === 'danger' && "rgb(239 68 68)",
                status === 'warning' && "rgb(234 179 8)",
                status === 'success' && "rgb(34 197 94)"
              )
            } as React.CSSProperties}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{Math.round(percentage)}% used</span>
            <span>{Math.round(100 - percentage)}% remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 