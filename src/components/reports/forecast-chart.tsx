import React, { useMemo } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
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

    // Safety check for extremely large datasets
    if (baselineData.length > 3000) {
      console.warn(`ForecastChart received very large dataset (${baselineData.length} items), sampling data for performance`);
    }

    // Sort data by date
    const sortedData = [...baselineData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Identify initial balance entry (if present)
    let initialBalanceAmount = 0;
    const filteredData = sortedData.filter(item => {
      if (item.type === 'balance' && item.name === 'Current Balance') {
        initialBalanceAmount = item.amount;
        return false; // Remove initial balance entry from the dataset
      }
      return true;
    });

    // Determine the interval based on timeFrame and data size
    let interval = 1; // days
    if (timeFrame === "1m") interval = 1; // daily for 1 month
    else if (timeFrame === "3m") interval = 7; // weekly for 3 months
    else if (timeFrame === "6m") interval = 14; // bi-weekly for 6 months
    else if (timeFrame === "12m") interval = 30; // monthly for 1 year

    // For very large datasets, increase the interval to reduce data points
    if (baselineData.length > 1000) {
      interval = Math.max(interval, Math.ceil(baselineData.length / 100));
    }

    // Create period boundaries with limited number of periods
    const maxPeriods = 20; // Maximum number of data points to show
    const startDate = new Date(filteredData.length > 0 ? filteredData[0].date : new Date());
    const endDate = new Date(filteredData.length > 0 ? filteredData[filteredData.length - 1].date : new Date());
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Adjust interval if we would have too many periods
    if (totalDays / interval > maxPeriods) {
      interval = Math.ceil(totalDays / maxPeriods);
    }

    // Group data into periods
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
    
    // Initialize period data with map for better performance
    const groupedData: Record<string, any> = {};
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
    
    // Batch process data points to periods for better performance
    // For large datasets, only keep important transactions (high value or first/last)
    const transactionLimit = 10;
    
    // Assign data points to periods
    filteredData.forEach(item => {
      const itemDate = new Date(item.date);
      
      // Find which period this item belongs to
      for (const period of periods) {
        if (itemDate >= period.start && itemDate <= period.end) {
          const periodKey = period.label;
          const periodData = groupedData[periodKey];
          
          // Add to transactions list with limit for memory
          if (periodData.transactions.length < transactionLimit) {
            periodData.transactions.push({
              id: item.itemId || item.id,
              date: item.date,
              amount: item.amount,
              name: item.name,
              category: item.category,
              type: item.type,
              description: item.description
            });
          }
          
          // Use the latest running balance as the period's balance
          if (item.runningBalance !== undefined) {
            periodData.runningBalance = item.runningBalance;
          }
          
          break; // Exit the loop once we found the right period
        }
      }
    });
    
    // Convert to array and ensure running balance continuity
    const result = Object.values(groupedData);
    
    // Fill in missing running balances with the previous value
    // Start with initial balance if we filtered it out
    let lastBalance = initialBalanceAmount;
    for (let i = 0; i < result.length; i++) {
      if (result[i].runningBalance === null) {
        result[i].runningBalance = lastBalance;
      } else {
        lastBalance = result[i].runningBalance;
      }
    }

    // Process scenario data if available
    if (scenarioData && scenarioData.length > 0) {
      // Apply the same sorting and filtering logic to scenario data
      const sortedScenarioData = [...scenarioData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Extract initial balance
      let scenarioInitialBalance = 0;
      const filteredScenarioData = sortedScenarioData.filter(item => {
        if (item.type === 'balance' && item.name === 'Current Balance') {
          scenarioInitialBalance = item.amount;
          return false;
        }
        return true;
      });

      // Process scenario data to periods
      filteredScenarioData.forEach(item => {
        const itemDate = new Date(item.date);
        
        for (const period of periods) {
          if (itemDate >= period.start && itemDate <= period.end) {
            const periodKey = period.label;
            const periodData = groupedData[periodKey];
            
            if (item.runningBalance !== undefined) {
              periodData.scenarioBalance = item.runningBalance;
            }
            
            break;
          }
        }
      });
      
      // Fill in missing scenario balances
      let lastScenarioBalance = scenarioInitialBalance;
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

  // Custom tooltip to show detailed transaction information - optimized to handle fewer items
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
                {periodData.transactions.slice(0, 5).map((t: any, i: number) => (
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
                {periodData.transactions.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center pt-1">
                    + {periodData.transactions.length - 5} more transactions
                  </div>
                )}
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
            name="Balance"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#balanceGradient)"
            isAnimationActive={false}
          />
          {scenarioData && scenarioData.length > 0 && (
            <Area
              type="monotone"
              dataKey="scenarioBalance"
              name="Scenario"
              stroke="#10b981"
              fillOpacity={0.5}
              fill="url(#scenarioGradient)"
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
