"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle2, Star, Sun, Sparkles } from "lucide-react";

interface GoalVisualizationProps {
  name: string;
  saved: number;
  target: number;
  type?: "adventure" | "jar" | "envelope" | "balloon";
  icon?: React.ReactNode;
  category?: string;
  checkpoints?: Array<{
    amount: number;
    label: string;
  }>;
}

export function GoalVisualization({
  name,
  saved,
  target,
  type = "jar",
  icon,
  category = "",
  checkpoints = []
}: GoalVisualizationProps) {
  const percentage = useMemo(() => Math.min(100, (saved / target) * 100), [saved, target]);
  const status = useMemo(() => {
    if (percentage >= 100) return "complete";
    if (percentage >= 75) return "near";
    if (percentage >= 25) return "progress";
    return "start";
  }, [percentage]);

  const remaining = target - saved;

  const renderVisualization = () => {
    switch (type) {
      case "adventure":
        return (
          <div className="relative h-48 w-full flex items-center justify-center">
            <div className="relative w-full h-40 bg-green-100 dark:bg-green-900/20 rounded-xl overflow-hidden">
              {/* Adventure map background */}
              <div className="absolute inset-0 p-4">
                {/* Path animation */}
                <svg width="100%" height="100%" viewBox="0 0 300 120" className="absolute inset-0">
                  <path
                    d="M20,100 Q40,60 80,80 T140,60 T200,80 T260,40"
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    className="stroke-primary/60"
                  />
                  
                  {/* Checkpoints along the path */}
                  {checkpoints.map((checkpoint, index) => {
                    const checkpointPercentage = (checkpoint.amount / target) * 100;
                    const completed = percentage >= checkpointPercentage;
                    
                    // Position checkpoints along the path
                    const xPos = 20 + (index + 1) * 60;
                    const yPos = index % 2 === 0 ? 80 : 60;
                    
                    return (
                      <g key={index} className={cn(completed ? "text-primary" : "text-muted-foreground/40")}>
                        <circle cx={xPos} cy={yPos} r="8" className={cn("fill-current")} />
                        <text x={xPos} y={yPos + 20} textAnchor="middle" className="text-[8px] fill-current">{checkpoint.label}</text>
                      </g>
                    );
                  })}
                  
                  {/* Current position indicator */}
                  <circle
                    cx={20 + Math.min(240, (percentage / 100) * 240)}
                    cy={100 - Math.min(60, (percentage / 100) * 60)}
                    r="6"
                    className="fill-red-500 animate-pulse"
                  />
                </svg>
                
                {/* Start and Goal markers */}
                <div className="absolute bottom-2 left-2 text-sm font-medium text-primary">Start</div>
                <div className="absolute top-2 right-2 text-sm font-medium text-primary flex items-center">
                  Goal
                  {status === "complete" && <CheckCircle2 className="h-4 w-4 ml-1 text-green-500" />}
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-4 left-8">
                  <Sun className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="absolute top-16 right-16">
                  <Sparkles className="h-4 w-4 text-pink-400" />
                </div>
                <div className="absolute bottom-8 right-32">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        );

      case "jar":
        return (
          <div className="relative h-48 w-full flex items-center justify-center">
            <div className="relative w-32 h-40">
              {/* Jar container */}
              <div className="absolute inset-x-0 bottom-0 top-8 rounded-2xl border-2 border-primary/40 overflow-hidden">
                {/* Jar contents */}
                <div
                  className="absolute inset-x-0 bottom-0 bg-primary/20 transition-all duration-1000"
                  style={{ height: `${percentage}%` }}
                >
                  {/* Animated coins and waves */}
                  <div className="absolute inset-x-0 h-2 bg-primary/30 animate-wave" />
                  
                  {/* Floating particles (coins, sparkles) */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-4 h-4 rounded-full bg-yellow-400 animate-float"
                      style={{
                        left: `${10 + (i * 15)}%`,
                        bottom: `${10 + (i * 12)}%`,
                        animationDelay: `${i * 0.5}s`
                      }}
                    >
                      <div className="absolute inset-2 flex items-center justify-center text-yellow-600 text-[8px]">$</div>
                    </div>
                  ))}
                  
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute text-pink-500 animate-float"
                      style={{
                        left: `${20 + (i * 20)}%`,
                        bottom: `${30 + (i * 15)}%`,
                        animationDelay: `${0.3 + (i * 0.5)}s`
                      }}
                    >
                      <Sparkles className="h-3 w-3" />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Jar lid */}
              <div className="absolute inset-x-2 top-0 h-8 rounded-t-lg border-2 border-primary/40 bg-primary/10">
                <div className="absolute inset-x-0 top-1 h-1 border-b border-primary/20" />
                <div className="absolute inset-x-0 top-3 h-1 border-b border-primary/20" />
                <div className="absolute inset-x-0 top-5 h-1 border-b border-primary/20" />
              </div>
            </div>
          </div>
        );

      case "envelope":
        return (
          <div className="relative h-48 w-full flex items-center justify-center">
            <div className="relative w-40 h-32">
              {/* Envelope body */}
              <div className="absolute inset-0 border-2 border-primary/60 rounded-md overflow-hidden">
                {/* Fill with money */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-primary/10 transition-all duration-1000"
                  style={{ height: `${percentage}%` }}
                >
                  {/* Money and sparkles */}
                  {percentage > 30 && (
                    <>
                      <div className="absolute top-1 left-4 w-12 h-6 bg-green-300 rounded-sm rotate-[10deg] shadow-sm">
                        <div className="absolute inset-0 flex items-center justify-center text-green-700 text-xs">$</div>
                      </div>
                      <div className="absolute top-3 right-5 w-10 h-5 bg-green-300 rounded-sm rotate-[-15deg] shadow-sm">
                        <div className="absolute inset-0 flex items-center justify-center text-green-700 text-xs">$</div>
                      </div>
                    </>
                  )}
                  
                  {percentage > 60 && (
                    <>
                      <div className="absolute top-8 left-6 w-14 h-7 bg-green-300 rounded-sm rotate-[-5deg] shadow-sm">
                        <div className="absolute inset-0 flex items-center justify-center text-green-700 text-xs">$</div>
                      </div>
                      <div className="absolute right-2 bottom-2 text-pink-500">
                        <Sparkles className="h-3 w-3" />
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Envelope flap */}
              <div
                className="absolute inset-x-0 top-0 border-b-[40px] border-l-[20px] border-r-[20px] border-primary/60 transition-all duration-1000"
                style={{
                  transform: `rotateX(${Math.min(60, (percentage / 100) * 60)}deg)`,
                  transformOrigin: "top",
                  borderBottomColor: "transparent"
                }}
              />
            </div>
          </div>
        );

      case "balloon":
        return (
          <div className="relative h-48 w-full flex items-center justify-center">
            <div className="relative w-full h-40">
              {/* Balloon */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-1000"
                style={{
                  width: `${Math.max(32, percentage * 0.8)}px`,
                  height: `${Math.max(40, percentage)}px`,
                  bottom: `${Math.min(percentage * 0.3, 30)}px`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-full bg-primary/30 transition-all duration-1000"
                  style={{
                    transform: status === 'complete' ? 'scale(1.2)' : 'scale(1)',
                    opacity: status === 'complete' ? 0 : 1,
                  }}
                />
                
                {/* Balloon body */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full transition-all duration-1000",
                    status === "complete" ? "bg-transparent" : "bg-primary/70"
                  )}
                />
                
                {/* Balloon string */}
                <div className="absolute w-0.5 h-12 bg-primary/60 left-1/2 bottom-0 transform -translate-x-1/2 translate-y-full" />
                
                {/* Explosion effect when goal is reached */}
                {status === "complete" && (
                  <div className="absolute inset-[-100%]">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-4 h-4 animate-float"
                        style={{
                          left: `${50 + Math.cos(i * 30 * Math.PI / 180) * 50}%`,
                          top: `${50 + Math.sin(i * 30 * Math.PI / 180) * 50}%`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      >
                        <Star className="h-full w-full text-pink-500" />
                      </div>
                    ))}
                    
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i + 12}
                        className="absolute w-2 h-2 animate-float"
                        style={{
                          left: `${50 + Math.cos((i * 45 + 20) * Math.PI / 180) * 40}%`,
                          top: `${50 + Math.sin((i * 45 + 20) * Math.PI / 180) * 40}%`,
                          animationDelay: `${i * 0.15 + 0.2}s`
                        }}
                      >
                        <Sparkles className="h-full w-full text-yellow-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Sun and decorations */}
              <div className="absolute top-2 right-8">
                <Sun className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="absolute top-16 left-8">
                <Sparkles className="h-4 w-4 text-pink-400" />
              </div>
            </div>
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
                {category}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderVisualization()}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target</span>
            <span className="font-medium">${target.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Saved</span>
            <span className="font-medium">${saved.toLocaleString()}</span>
          </div>
          <Progress 
            value={percentage} 
            className={cn(
              "h-2 mt-2",
              status === "complete" && "bg-green-100 dark:bg-green-900/20",
              status === "near" && "bg-blue-100 dark:bg-blue-900/20",
              status === "progress" && "bg-yellow-100 dark:bg-yellow-900/20",
              status === "start" && "bg-gray-100 dark:bg-gray-900/20"
            )} 
          />
          <div className="flex justify-between text-sm pt-1">
            <span className="text-muted-foreground">{Math.round(percentage)}% saved</span>
            <span className="font-medium">${remaining.toLocaleString()} to go</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 