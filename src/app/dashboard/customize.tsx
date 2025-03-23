"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Grid, LayoutGrid, Layers, Move, Plus, Settings, X } from "lucide-react";
import { cn } from "@/lib/utils";

type WidgetSize = "small" | "medium" | "large";
type WidgetType =
  | "account-balance"
  | "income-expense"
  | "upcoming-bills"
  | "recent-transactions"
  | "budget-overview"
  | "savings-goals"
  | "ai-insights"
  | "spending-trends"
  | "category-breakdown"
  | "financial-calendar";

interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  enabled: boolean;
  position: number;
}

const availableWidgets: {
  type: WidgetType;
  title: string;
  description: string;
  defaultSize: WidgetSize;
  icon: React.ReactNode;
}[] = [
  {
    type: "account-balance",
    title: "Account Balance",
    description: "Shows your current balances across all accounts",
    defaultSize: "small",
    icon: <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">$</div>
  },
  {
    type: "income-expense",
    title: "Income & Expenses",
    description: "Monthly summary of income and expenses",
    defaultSize: "medium",
    icon: <Grid className="w-6 h-6 text-primary" />
  },
  {
    type: "upcoming-bills",
    title: "Upcoming Bills",
    description: "Shows bills due in the next 30 days",
    defaultSize: "medium",
    icon: <Layers className="w-6 h-6 text-primary" />
  },
  {
    type: "recent-transactions",
    title: "Recent Transactions",
    description: "Your latest financial activity",
    defaultSize: "medium",
    icon: <ChevronsUpDown className="w-6 h-6 text-primary" />
  },
  {
    type: "budget-overview",
    title: "Budget Overview",
    description: "Visual summary of your budget status",
    defaultSize: "medium",
    icon: <LayoutGrid className="w-6 h-6 text-primary" />
  },
  {
    type: "savings-goals",
    title: "Savings Goals",
    description: "Progress toward your savings targets",
    defaultSize: "medium",
    icon: <div className="w-6 h-6 flex items-center justify-center text-primary text-lg font-bold">🎯</div>
  },
  {
    type: "ai-insights",
    title: "AI Insights",
    description: "Personalized financial recommendations",
    defaultSize: "large",
    icon: <div className="w-6 h-6 flex items-center justify-center text-primary text-lg font-bold">✨</div>
  },
  {
    type: "spending-trends",
    title: "Spending Trends",
    description: "Visual patterns of your spending over time",
    defaultSize: "large",
    icon: <div className="w-6 h-6 flex items-center justify-center text-primary text-lg font-bold">📊</div>
  },
  {
    type: "category-breakdown",
    title: "Category Breakdown",
    description: "Where your money is going by category",
    defaultSize: "medium",
    icon: <div className="w-6 h-6 flex items-center justify-center text-primary text-lg font-bold">🔄</div>
  },
  {
    type: "financial-calendar",
    title: "Financial Calendar",
    description: "Calendar view of upcoming financial events",
    defaultSize: "large",
    icon: <div className="w-6 h-6 flex items-center justify-center text-primary text-lg font-bold">📅</div>
  },
];

export function DashboardCustomize() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("layout");
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([
    { id: "1", type: "account-balance", title: "Account Balance", size: "small", enabled: true, position: 0 },
    { id: "2", type: "income-expense", title: "Income & Expenses", size: "medium", enabled: true, position: 1 },
    { id: "3", type: "upcoming-bills", title: "Upcoming Bills", size: "medium", enabled: true, position: 2 },
    { id: "4", type: "recent-transactions", title: "Recent Transactions", size: "medium", enabled: true, position: 3 },
    { id: "5", type: "budget-overview", title: "Budget Overview", size: "medium", enabled: true, position: 4 },
    { id: "6", type: "ai-insights", title: "AI Insights", size: "large", enabled: false, position: 5 },
  ]);

  const enabledWidgets = dashboardWidgets.filter(widget => widget.enabled)
    .sort((a, b) => a.position - b.position);

  const availableToAdd = availableWidgets.filter(available =>
    !dashboardWidgets.some(widget => widget.type === available.type)
  );

  const toggleWidgetEnabled = (id: string) => {
    setDashboardWidgets(dashboardWidgets.map(widget =>
      widget.id === id ? { ...widget, enabled: !widget.enabled } : widget
    ));
  };

  const moveWidgetUp = (index: number) => {
    if (index === 0) return;

    const newWidgets = [...enabledWidgets];
    const temp = newWidgets[index - 1].position;
    newWidgets[index - 1].position = newWidgets[index].position;
    newWidgets[index].position = temp;

    setDashboardWidgets([
      ...dashboardWidgets.filter(widget => !widget.enabled),
      ...newWidgets
    ]);
  };

  const moveWidgetDown = (index: number) => {
    if (index === enabledWidgets.length - 1) return;

    const newWidgets = [...enabledWidgets];
    const temp = newWidgets[index + 1].position;
    newWidgets[index + 1].position = newWidgets[index].position;
    newWidgets[index].position = temp;

    setDashboardWidgets([
      ...dashboardWidgets.filter(widget => !widget.enabled),
      ...newWidgets
    ]);
  };

  const changeWidgetSize = (id: string, size: WidgetSize) => {
    setDashboardWidgets(dashboardWidgets.map(widget =>
      widget.id === id ? { ...widget, size } : widget
    ));
  };

  const addNewWidget = (type: WidgetType) => {
    const widgetToAdd = availableWidgets.find(w => w.type === type);
    if (!widgetToAdd) return;

    const newWidget: DashboardWidget = {
      id: `new-${Date.now()}`,
      type,
      title: widgetToAdd.title,
      size: widgetToAdd.defaultSize,
      enabled: true,
      position: dashboardWidgets.length
    };

    setDashboardWidgets([...dashboardWidgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setDashboardWidgets(dashboardWidgets.filter(widget => widget.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Settings className="h-4 w-4" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Your Dashboard</DialogTitle>
          <DialogDescription>
            Personalize your dashboard layout and widgets to see what matters most to you.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="layout" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="layout">Widget Layout</TabsTrigger>
            <TabsTrigger value="add">Add Widgets</TabsTrigger>
          </TabsList>

          <TabsContent value="layout" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Visible Widgets</h3>
                  <p className="text-xs text-muted-foreground">
                    Arrange and configure the widgets visible on your dashboard.
                  </p>
                </div>
                <div className="text-right">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("add")} className="gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add Widget
                  </Button>
                </div>
              </div>

              <div className="border rounded-md">
                {enabledWidgets.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">No widgets enabled. Add some widgets to get started.</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setActiveTab("add")}
                    >
                      Browse Widgets
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {enabledWidgets.map((widget, index) => (
                      <div key={widget.id} className="flex items-center p-4 gap-3">
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveWidgetUp(index)}
                            disabled={index === 0}
                          >
                            <ChevronsUpDown className="h-4 w-4 rotate-180" />
                            <span className="sr-only">Move up</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveWidgetDown(index)}
                            disabled={index === enabledWidgets.length - 1}
                          >
                            <ChevronsUpDown className="h-4 w-4" />
                            <span className="sr-only">Move down</span>
                          </Button>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{widget.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {availableWidgets.find(w => w.type === widget.type)?.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div>
                            <Select
                              value={widget.size}
                              onValueChange={(value) => changeWidgetSize(widget.id, value as WidgetSize)}
                            >
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeWidget(widget.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="add" className="mt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Available Widgets</h3>
                <p className="text-xs text-muted-foreground">
                  Add these widgets to your dashboard to see more information at a glance.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableWidgets.map((widget) => {
                  const isAdded = dashboardWidgets.some(w => w.type === widget.type);

                  return (
                    <Card key={widget.type} className={cn(
                      isAdded && "border-primary"
                    )}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {widget.icon}
                            <CardTitle className="text-base">{widget.title}</CardTitle>
                          </div>
                          {isAdded && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground">{widget.description}</p>
                      </CardContent>
                      <CardFooter>
                        {isAdded ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              const existingWidget = dashboardWidgets.find(w => w.type === widget.type);
                              if (existingWidget) {
                                toggleWidgetEnabled(existingWidget.id);
                              }
                            }}
                          >
                            {dashboardWidgets.find(w => w.type === widget.type)?.enabled
                              ? "Disable Widget"
                              : "Enable Widget"
                            }
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() => addNewWidget(widget.type)}
                          >
                            Add to Dashboard
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper Select component for the dashboard customization
function Select({ value, onValueChange, children }: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full"
      >
        <span>{value.charAt(0).toUpperCase() + value.slice(1)}</span>
        <ChevronsUpDown className="h-3 w-3 opacity-50" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
          {children}
        </div>
      )}
    </div>
  );
}

function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="py-1">{children}</div>
  );
}

function SelectItem({ value, children, onClick }: {
  value: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

function SelectValue() {
  return null;
}
