"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  BarChart3,
  DollarSign,
  ArrowRight,
  AlertCircle,
  Sparkles
} from "lucide-react";

type InsightType = "spending" | "savings" | "budget" | "anomaly";

interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  impact: number; // Positive or negative percentage/amount
  actionable: boolean;
  priority: "high" | "medium" | "low";
  dateGenerated: string;
  category?: string;
}

export function FinancialInsights() {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  // This would come from an API in a real implementation
  const insights: Insight[] = [
    {
      id: "1",
      type: "spending",
      title: "Dining expenses increased by 32%",
      description: "Your dining out expenses have increased significantly compared to your 3-month average. Consider setting a specific dining budget.",
      impact: -32,
      actionable: true,
      priority: "medium",
      dateGenerated: "2025-03-23",
      category: "Food & Dining"
    },
    {
      id: "2",
      type: "budget",
      title: "Entertainment budget consistently underspent",
      description: "You've been spending less than 60% of your entertainment budget for 4 months. Consider reallocating $50 to your savings goals.",
      impact: 40,
      actionable: true,
      priority: "low",
      dateGenerated: "2025-03-22",
      category: "Entertainment"
    },
    {
      id: "3",
      type: "anomaly",
      title: "Unusual transaction detected",
      description: "A payment of $89.99 to 'Digital Subscription Co' appears to be a new recurring charge not previously categorized.",
      impact: -89.99,
      actionable: true,
      priority: "high",
      dateGenerated: "2025-03-21"
    },
    {
      id: "4",
      type: "savings",
      title: "Savings opportunity identified",
      description: "Based on your cash flow, you could increase your monthly savings by $215 while maintaining your current lifestyle.",
      impact: 215,
      actionable: true,
      priority: "medium",
      dateGenerated: "2025-03-20"
    },
    {
      id: "5",
      type: "spending",
      title: "Subscription services total $127/month",
      description: "You're spending $127 monthly on subscriptions. We've identified 3 services with similar functionality.",
      impact: -127,
      actionable: true,
      priority: "medium",
      dateGenerated: "2025-03-19",
      category: "Subscriptions"
    },
    {
      id: "6",
      type: "budget",
      title: "Utility bills higher than expected",
      description: "Your utility bills are 18% higher than the same period last year. This might be due to increased rates or usage.",
      impact: -18,
      actionable: false,
      priority: "low",
      dateGenerated: "2025-03-18",
      category: "Utilities"
    },
  ];

  const filteredInsights = insights
    .filter(insight => !dismissedInsights.includes(insight.id))
    .filter(insight => {
      if (activeTab === "all") return true;
      return insight.type === activeTab;
    })
    .sort((a, b) => {
      // Sort by priority (high, medium, low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const dismissInsight = (id: string) => {
    setDismissedInsights([...dismissedInsights, id]);
  };

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case "spending":
        return <TrendingDown className="h-5 w-5 text-rose-500" />;
      case "savings":
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case "budget":
        return <BarChart3 className="h-5 w-5 text-blue-500" />;
      case "anomaly":
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-amber-500" />;
    }
  };

  const getPriorityBadge = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium Priority</Badge>;
      case "low":
        return <Badge variant="outline">Low Priority</Badge>;
    }
  };

  const getImpactDisplay = (impact: number) => {
    if (impact > 0) {
      return (
        <span className="text-emerald-500 font-medium">
          {impact > 1 ? `+$${impact.toFixed(2)}` : `+${impact}%`}
        </span>
      );
    } else {
      return (
        <span className="text-rose-500 font-medium">
          {Math.abs(impact) > 1 ? `-$${Math.abs(impact).toFixed(2)}` : `${impact}%`}
        </span>
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Financial Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your financial data
          </CardDescription>
        </div>
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-[400px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="spending">Spending</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="savings">Savings</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No insights available for this category at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <Card key={insight.id} className="overflow-hidden">
                <div className={`h-1 w-full ${
                  insight.priority === "high" ? "bg-rose-500" :
                  insight.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                }`} />
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-base">{insight.title}</CardTitle>
                    </div>
                    {getPriorityBadge(insight.priority)}
                  </div>
                  {insight.category && (
                    <Badge variant="outline" className="mt-1">{insight.category}</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-4 pt-0 pb-2">
                  <p className="text-sm text-muted-foreground">{insight.description}</p>

                  {insight.impact !== 0 && (
                    <p className="mt-2 text-sm">
                      Potential impact: {getImpactDisplay(insight.impact)}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between">
                  <p className="text-xs text-muted-foreground">
                    Generated on {new Date(insight.dateGenerated).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissInsight(insight.id)}
                    >
                      Dismiss
                    </Button>
                    {insight.actionable && (
                      <Button size="sm" className="gap-1">
                        Take Action
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">Updated daily based on your financial activity</p>
        <Button variant="outline" className="gap-1">
          <Sparkles className="h-4 w-4" />
          Generate More Insights
        </Button>
      </CardFooter>
    </Card>
  );
}
