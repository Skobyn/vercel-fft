import React, { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { formatCurrency } from "@/utils/financial-utils";
import { ForecastItem } from "@/types/financial";

interface ForecastChartProps {
  baselineData: ForecastItem[];
  scenarioData?: ForecastItem[];
  className?: string;
  timeFrame?: "1m" | "3m" | "6m" | "12m";
}

export function ForecastChart({ baselineData, scenarioData, className, timeFrame = "3m" }: ForecastChartProps) {
  // Process data based on timeFrame to create aggregated data points
  const processedData = useMemo(() => {
    if (!baselineData.length) return [];

    // Sort data by date
    const sortedData = [...baselineData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Determine the interval based on timeFrame
    let interval = 1; // days
    if (timeFrame === "3m") interval = 7; // weekly
    else if (timeFrame === "6m") interval = 14; // bi-weekly
    else if (timeFrame === "12m") interval = 30; // monthly

    // Group data into periods
    const groupedData: Record<string, any> = {};
    const startDate = new Date(sortedData[0].date);
    const endDate = new Date(sortedData[sortedData.length - 1].date);
    
    // Create period boundaries
    const periods: { start: Date, end: Date, label: string }[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const periodStart = new Date(currentDate);
      const periodEnd = new Date(currentDate);
      periodEnd.setDate(periodEnd.getDate() + interval - 1);
      
      const label = timeFrame === "12m" 
        ? `${currentDate.toLocaleDateString('en-US', { month: 'short' })}` 
        : `${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      
      periods.push({ 
        start: periodStart, 
        end: periodEnd, 
        label
      });
      
      // Move to next period
      currentDate.setDate(currentDate.getDate() + interval);
    }
    
    // Initialize period data
    periods.forEach(period => {
      const periodKey = period.label;
      groupedData[periodKey] = {
        date: period.start.toISOString(),
        displayDate: period.label,
        periodStart: period.start,
        periodEnd: period.end,
        runningBalance: null,
        transactions: []
      };
    });
    
    // Assign data points to periods
    sortedData.forEach(item => {
      const itemDate = new Date(item.date);
      
      // Find which period this item belongs to
      const period = periods.find(p => itemDate >= p.start && itemDate <= p.end);
      
      if (period) {
        const periodKey = period.label;
        
        // Add to transactions list
        groupedData[periodKey].transactions.push({
          id: item.itemId || item.id,
          date: item.date,
          amount: item.amount,
          name: item.name,
          category: item.category,
          type: item.type,
          description: item.description
        });
        
        // Use the latest running balance as the period's balance
        if (item.runningBalance !== undefined) {
          groupedData[periodKey].runningBalance = item.runningBalance;
        }
      }
    });
    
    // Convert to array and ensure running balance continuity
    const result = Object.values(groupedData);
    
    // Fill in missing running balances with the previous value
    let lastBalance = baselineData[0]?.runningBalance || 0;
    for (let i = 0; i < result.length; i++) {
      if (result[i].runningBalance === null) {
        result[i].runningBalance = lastBalance;
      } else {
        lastBalance = result[i].runningBalance;
      }
    }
    
    // Process scenario data if available
    if (scenarioData && scenarioData.length > 0) {
      const sortedScenario = [...scenarioData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      // Assign scenario balance to periods
      sortedScenario.forEach(item => {
        const itemDate = new Date(item.date);
        
        // Find which period this item belongs to
        const period = periods.find(p => itemDate >= p.start && itemDate <= p.end);
        
        if (period && item.runningBalance !== undefined) {
          const periodKey = period.label;
          const periodIndex = result.findIndex(r => r.displayDate === periodKey);
          
          if (periodIndex !== -1) {
            result[periodIndex].scenarioBalance = item.runningBalance;
            
            // Add to scenario transactions
            if (!result[periodIndex].scenarioTransactions) {
              result[periodIndex].scenarioTransactions = [];
            }
            
            result[periodIndex].scenarioTransactions.push({
              id: item.itemId || item.id,
              date: item.date,
              amount: item.amount,
              name: item.name,
              category: item.category,
              type: item.type,
              description: item.description
            });
          }
        }
      });
      
      // Fill in missing scenario balances
      let lastScenarioBalance = scenarioData[0]?.runningBalance || 0;
      for (let i = 0; i < result.length; i++) {
        if (result[i].scenarioBalance === undefined) {
          result[i].scenarioBalance = lastScenarioBalance;
        } else {
          lastScenarioBalance = result[i].scenarioBalance;
        }
      }
    }
    
    return result;
  }, [baselineData, scenarioData, timeFrame]);

  // Custom tooltip to show detailed transaction information
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].payload) {
      const periodData = payload[0].payload;
      
      return (
        <div className="bg-background border rounded p-3 shadow-md max-w-md">
          <p className="font-medium">{periodData.displayDate}</p>
          <div className="h-px w-full bg-border my-1" />
          
          <p className="text-sm font-medium">
            Balance: <span>{formatCurrency(periodData.runningBalance ?? 0)}</span>
          </p>
          
          {periodData.scenarioBalance && (
            <p className="text-sm font-medium text-emerald-500">
              Scenario Balance: <span>{formatCurrency(periodData.scenarioBalance)}</span>
            </p>
          )}
          
          {periodData.transactions && periodData.transactions.length > 0 && (
            <>
              <div className="h-px w-full bg-border my-2" />
              <p className="text-sm font-semibold">Transactions:</p>
              <div className="max-h-40 overflow-y-auto mt-1">
                {periodData.transactions.map((t: any, i: number) => (
                  <div key={`${t.id || i}`} className="text-xs mb-1 py-1 border-b border-border/50">
                    <div className="flex justify-between">
                      <span className="font-medium">{t.name}</span>
                      <span className={t.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {t.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {t.category}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {periodData.scenarioTransactions && periodData.scenarioTransactions.length > 0 && (
            <>
              <div className="h-px w-full bg-border my-2" />
              <p className="text-sm font-semibold text-emerald-500">Scenario Transactions:</p>
              <div className="max-h-40 overflow-y-auto mt-1">
                {periodData.scenarioTransactions.map((t: any, i: number) => (
                  <div key={`scenario-${t.id || i}`} className="text-xs mb-1 py-1 border-b border-border/50">
                    <div className="flex justify-between">
                      <span className="font-medium">{t.name}</span>
                      <span className={t.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {t.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {t.category}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#666" strokeOpacity={0.2} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
            </linearGradient>
            <linearGradient id="scenarioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="runningBalance"
            name="Baseline"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#balanceGradient)"
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
          {scenarioData && (
            <Area
              type="monotone"
              dataKey="scenarioBalance"
              name="Scenario"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#scenarioGradient)"
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
