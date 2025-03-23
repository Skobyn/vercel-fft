import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart, ArrowRight, Download, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type SpendingTrendsChartProps = {
  className?: string;
};

export function SpendingTrendsChart({ className }: SpendingTrendsChartProps) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [chartType, setChartType] = React.useState<"bar" | "line">("bar");
  const [timeframe, setTimeframe] = React.useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");

  // This would be fetched from API in a real app
  const trendData = {
    categories: {
      labels: ["Housing", "Food", "Transport", "Utilities", "Entertainment", "Shopping", "Healthcare"],
      current: [1450, 420, 275, 230, 250, 180, 150],
      previous: [1400, 380, 300, 220, 200, 150, 120],
    },
    time: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      spending: [2800, 3100, 2950, 3200, 2800, 3000, 3100, 3250, 3400, 3250, 3300, 3450],
      income: [4200, 4200, 4500, 4200, 4200, 4200, 4500, 4200, 4500, 4200, 4200, 4500],
    },
    weekly: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
      spending: [750, 850, 700, 950],
    },
    daily: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      spending: [120, 95, 145, 110, 220, 180, 130],
    },
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
          <div>
            <CardTitle>Spending Patterns & Trends</CardTitle>
            <CardDescription>Track how your spending changes over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {date ? format(date, "LLL yyyy") : "Select month"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
              <SelectTrigger className="h-8 w-[110px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex p-1 border rounded-md">
              <Button
                variant={chartType === "bar" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setChartType("bar")}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="sr-only">Bar Chart</span>
              </Button>
              <Button
                variant={chartType === "line" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setChartType("line")}
              >
                <LineChart className="h-3.5 w-3.5" />
                <span className="sr-only">Line Chart</span>
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="spending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="spending">Spending Over Time</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="spending" className="space-y-4">
            <div className="h-[300px] flex flex-col items-center justify-center border rounded-md bg-muted/20 p-4">
              {chartType === "bar" ? (
                <BarChart3 className="h-16 w-16 text-muted-foreground" />
              ) : (
                <LineChart className="h-16 w-16 text-muted-foreground" />
              )}
              <p className="text-sm text-muted-foreground mt-4 text-center">
                {timeframe === "monthly" && "Monthly spending chart visualization would be shown here"}
                {timeframe === "weekly" && "Weekly spending chart visualization would be shown here"}
                {timeframe === "daily" && "Daily spending chart visualization would be shown here"}
                {timeframe === "yearly" && "Yearly spending chart visualization would be shown here"}
              </p>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">Average Spending</div>
                  <div className="text-2xl font-bold mt-1">$105/day</div>
                  <div className="text-xs text-muted-foreground flex items-center mt-1">
                    <span className="text-emerald-500 mr-1">↓ 7%</span> compared to last month
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">Top Spending Day</div>
                  <div className="text-2xl font-bold mt-1">Saturday</div>
                  <div className="text-xs text-muted-foreground flex items-center mt-1">
                    <span className="text-rose-500 mr-1">↑ 15%</span> more spending on weekends
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="text-sm font-medium">Monthly Trend</div>
                  <div className="text-2xl font-bold mt-1">Decreasing</div>
                  <div className="text-xs text-muted-foreground flex items-center mt-1">
                    <span className="text-emerald-500 mr-1">↓ 3.2%</span> past 3 months
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="h-[300px] flex flex-col items-center justify-center border rounded-md bg-muted/20 p-4">
              <BarChart3 className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Category comparison chart visualization would be shown here
              </p>
            </div>

            <div className="border rounded-md">
              <div className="grid grid-cols-3 gap-4 p-4 border-b">
                <div className="font-medium">Category</div>
                <div className="font-medium text-right">This Month</div>
                <div className="font-medium text-right">vs Last Month</div>
              </div>
              {trendData.categories.labels.map((category, index) => (
                <div key={category} className="grid grid-cols-3 gap-4 p-4 border-b last:border-0">
                  <div>{category}</div>
                  <div className="text-right">${trendData.categories.current[index]}</div>
                  <div className="text-right flex justify-end items-center">
                    {trendData.categories.current[index] > trendData.categories.previous[index] ? (
                      <span className="flex items-center text-rose-500">
                        <ArrowRight className="h-3 w-3 mr-1 rotate-45" />
                        {Math.round((trendData.categories.current[index] - trendData.categories.previous[index]) / trendData.categories.previous[index] * 100)}%
                      </span>
                    ) : (
                      <span className="flex items-center text-emerald-500">
                        <ArrowRight className="h-3 w-3 mr-1 -rotate-45" />
                        {Math.round((trendData.categories.previous[index] - trendData.categories.current[index]) / trendData.categories.previous[index] * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Spending Anomalies</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 bg-rose-100 p-1 rounded-full h-6 w-6 flex items-center justify-center mt-0.5">↑</span>
                      <div>
                        <p className="font-medium">Entertainment spending increased 25%</p>
                        <p className="text-muted-foreground">Higher than your 6-month average</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-500 bg-emerald-100 p-1 rounded-full h-6 w-6 flex items-center justify-center mt-0.5">↓</span>
                      <div>
                        <p className="font-medium">Grocery spending decreased 12%</p>
                        <p className="text-muted-foreground">Lower than your 6-month average</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 bg-amber-100 p-1 rounded-full h-6 w-6 flex items-center justify-center mt-0.5">!</span>
                      <div>
                        <p className="font-medium">Unusual transaction: Car Repair ($458)</p>
                        <p className="text-muted-foreground">Non-recurring large expense</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 bg-blue-100 p-1 rounded-full h-6 w-6 flex items-center justify-center mt-0.5">i</span>
                      <div>
                        <p className="font-medium">Reduce dining out expenses</p>
                        <p className="text-muted-foreground">Cut back to meet your monthly food budget</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 bg-blue-100 p-1 rounded-full h-6 w-6 flex items-center justify-center mt-0.5">i</span>
                      <div>
                        <p className="font-medium">Review your subscription services</p>
                        <p className="text-muted-foreground">You have 6 active subscriptions totaling $87.94/month</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 bg-blue-100 p-1 rounded-full h-6 w-6 flex items-center justify-center mt-0.5">i</span>
                      <div>
                        <p className="font-medium">Plan for upcoming expenses</p>
                        <p className="text-muted-foreground">Car insurance payment due next month</p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-3.5 w-3.5" />
                Download Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
