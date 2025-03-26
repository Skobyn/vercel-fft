"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, MapPin, Sparkles } from "lucide-react";

interface GoalVisualizationProps {
  saved: number;
  target: number;
  name: string;
  type?: 'adventure' | 'envelope' | 'balloon' | 'jar';
  checkpoints?: Array<{
    amount: number;
    reward: string;
    achieved: boolean;
  }>;
  onEdit?: () => void;
  onDelete?: () => void;
  onUpdateProgress?: (amount: number) => void;
}

export function GoalVisualization({ 
  saved, 
  target, 
  name, 
  type = 'jar',
  checkpoints = [] 
}: GoalVisualizationProps) {
  const percentage = useMemo(() => {
    return Math.min((saved / target) * 100, 100);
  }, [saved, target]);

  const status = useMemo(() => {
    if (percentage >= 100) return 'complete';
    if (percentage >= 75) return 'near';
    if (percentage >= 25) return 'progress';
    return 'start';
  }, [percentage]);

  if (type === 'adventure') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>
            {saved.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {target.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Adventure path */}
            <div className="relative h-32 mb-4">
              <div className="absolute inset-x-0 top-1/2 h-2 bg-secondary rounded-full" />
              
              {/* Checkpoints */}
              {checkpoints.map((checkpoint, index) => {
                const checkpointPercentage = (checkpoint.amount / target) * 100;
                const isAchieved = saved >= checkpoint.amount;
                
                return (
                  <div
                    key={index}
                    className="absolute top-1/2 -translate-y-1/2"
                    style={{ left: `${checkpointPercentage}%` }}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isAchieved ? "bg-green-500 border-green-600" : "bg-secondary border-muted-foreground"
                    )}>
                      <MapPin className="h-3 w-3 text-background" />
                    </div>
                    {isAchieved && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                      >
                        {checkpoint.reward}
                      </Badge>
                    )}
                  </div>
                );
              })}
              
              {/* Progress marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                style={{ left: `${percentage}%` }}
              >
                <Trophy className={cn(
                  "h-8 w-8 -translate-y-full mb-2",
                  status === 'complete' && "text-yellow-500",
                  status === 'near' && "text-blue-500",
                  status === 'progress' && "text-green-500",
                  status === 'start' && "text-muted-foreground"
                )} />
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
            {saved.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {target.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-40">
            {/* Envelope */}
            <div className={cn(
              "absolute inset-0 border-2 rounded-lg transition-all duration-500",
              status === 'complete' && "border-green-500 bg-green-50",
              status === 'near' && "border-blue-500 bg-blue-50",
              status === 'progress' && "border-yellow-500 bg-yellow-50",
              status === 'start' && "border-muted bg-secondary/50"
            )}>
              {/* Envelope flap */}
              <div 
                className={cn(
                  "absolute inset-x-0 top-0 h-12 transition-all duration-500",
                  status === 'complete' && "border-green-500",
                  status === 'near' && "border-blue-500",
                  status === 'progress' && "border-yellow-500",
                  status === 'start' && "border-muted"
                )}
                style={{
                  borderBottom: '2px solid',
                  transform: `rotateX(${percentage > 75 ? 45 : 0}deg)`,
                  transformOrigin: 'top',
                }}
              />
              
              {/* Money stack */}
              <div className="absolute inset-x-4 bottom-4 flex items-end justify-center">
                <div 
                  className={cn(
                    "w-full h-24 rounded bg-gradient-to-t transition-all duration-500",
                    status === 'complete' && "from-green-200 to-green-100",
                    status === 'near' && "from-blue-200 to-blue-100",
                    status === 'progress' && "from-yellow-200 to-yellow-100",
                    status === 'start' && "from-gray-200 to-gray-100"
                  )}
                  style={{
                    transform: `scaleY(${percentage / 100})`
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'balloon') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{name}</CardTitle>
          <CardDescription>
            {saved.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {target.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-40 flex items-center justify-center">
            {/* Balloon */}
            <div 
              className={cn(
                "relative transition-all duration-500",
                status === 'complete' && "animate-bounce",
              )}
              style={{
                transform: `scale(${0.5 + (percentage / 100)})`
              }}
            >
              <div className={cn(
                "w-20 h-24 rounded-full transition-colors",
                status === 'complete' && "bg-green-500",
                status === 'near' && "bg-blue-500",
                status === 'progress' && "bg-yellow-500",
                status === 'start' && "bg-muted"
              )} />
              <div className={cn(
                "absolute -bottom-4 left-1/2 -translate-x-1/2 w-4 h-6 transition-colors",
                status === 'complete' && "bg-green-600",
                status === 'near' && "bg-blue-600",
                status === 'progress' && "bg-yellow-600",
                status === 'start' && "bg-muted-foreground"
              )} />
              {status === 'complete' && (
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-yellow-200 animate-pulse" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default jar visualization
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{name}</CardTitle>
        <CardDescription>
          {saved.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} of {target.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-40">
          {/* Jar */}
          <div className="absolute inset-x-8 bottom-0 top-4">
            {/* Jar outline */}
            <div className="absolute inset-0 border-2 rounded-t-full rounded-b-lg" />
            
            {/* Jar neck */}
            <div className="absolute inset-x-4 top-0 h-6 border-x-2" />
            
            {/* Jar lid */}
            <div className="absolute inset-x-2 -top-2 h-2 border-2 rounded-full" />
            
            {/* Money fill */}
            <div 
              className={cn(
                "absolute inset-x-0 bottom-0 rounded-b-lg transition-all duration-500",
                status === 'complete' && "bg-green-500/20",
                status === 'near' && "bg-blue-500/20",
                status === 'progress' && "bg-yellow-500/20",
                status === 'start' && "bg-muted/20"
              )}
              style={{ height: `${percentage}%` }}
            >
              {/* Animated particles */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute w-2 h-2 rounded-full animate-float opacity-50",
                      status === 'complete' && "bg-green-300",
                      status === 'near' && "bg-blue-300",
                      status === 'progress' && "bg-yellow-300",
                      status === 'start' && "bg-muted"
                    )}
                    style={{
                      left: `${20 * i + 10}%`,
                      animationDelay: `${i * 0.5}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 