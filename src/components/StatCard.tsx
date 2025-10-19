import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: 'default' | 'success' | 'destructive';
}

export const StatCard = ({ title, value, icon, trend, variant = 'default' }: StatCardProps) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn(
          'p-2 rounded-lg',
          variant === 'success' && 'bg-success/10 text-success',
          variant === 'destructive' && 'bg-destructive/10 text-destructive',
          variant === 'default' && 'bg-primary/10 text-primary'
        )}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            'text-xs mt-1',
            trend.positive ? 'text-success' : 'text-destructive'
          )}>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
