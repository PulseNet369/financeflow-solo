import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { NetWorthSnapshot, Settings } from '@/types/finance';

interface NetWorthChartProps {
  history: NetWorthSnapshot[];
  formatCurrency: (value: number) => string;
  settings: Settings;
}

export const NetWorthChart = ({ history, formatCurrency, settings }: NetWorthChartProps) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1M' | '1Y'>('1M');

  const filterDataByTimeframe = (data: NetWorthSnapshot[]) => {
    if (data.length === 0) return [];
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeframe) {
      case '1D':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case '1M':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '1Y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return data
      .filter(snapshot => new Date(snapshot.date) >= cutoffDate)
      .map(snapshot => {
        // Recalculate net worth based on current settings
        const netWorth = settings.includeCreditInNetWorth
          ? snapshot.totalAssets + snapshot.availableCredit - snapshot.totalLiabilities - snapshot.totalCreditDebt
          : snapshot.totalAssets - snapshot.totalLiabilities - snapshot.totalCreditDebt;
        
        return {
          ...snapshot,
          netWorth,
          dateFormatted: new Date(snapshot.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            ...(timeframe === '1Y' ? { year: '2-digit' } : {}),
          }),
        };
      });
  };

  const filteredData = filterDataByTimeframe(history);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Net Worth Over Time</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={timeframe === '1D' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('1D')}
              className="h-7 px-2 text-xs"
            >
              1D
            </Button>
            <Button
              variant={timeframe === '1M' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('1M')}
              className="h-7 px-2 text-xs"
            >
              1M
            </Button>
            <Button
              variant={timeframe === '1Y' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe('1Y')}
              className="h-7 px-2 text-xs"
            >
              1Y
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="dateFormatted" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
                tickFormatter={(value) => {
                  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
              />
              <Tooltip
                formatter={(value) => formatCurrency(value as number)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
              />
              <Line
                type="monotone"
                dataKey="netWorth"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[250px]">
            <p className="text-sm text-muted-foreground">
              No historical data yet. Add assets or liabilities to start tracking.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
