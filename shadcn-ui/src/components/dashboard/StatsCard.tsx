import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'violet' | 'cyan' | 'pink';
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-primary/20 to-primary/5 text-primary',
    violet: 'from-secondary/20 to-secondary/5 text-secondary',
    cyan: 'from-accent/20 to-accent/5 text-accent',
    pink: 'from-pink-500/20 to-pink-500/5 text-pink-500',
  };

  return (
    <Card className="glass-panel p-3 sm:p-6 hover:scale-105 transition-transform duration-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-3xl font-bold mb-1 sm:mb-2">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs sm:text-sm font-medium',
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn(
          'w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0',
          colorClasses[color]
        )}>
          <Icon className="h-4 w-4 sm:h-6 sm:w-6" />
        </div>
      </div>
    </Card>
  );
}