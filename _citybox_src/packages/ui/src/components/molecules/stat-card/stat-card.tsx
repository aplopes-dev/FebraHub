import * as React from "react";
import { Card, CardContent } from "../../atoms/card";
import { cn } from "../../../lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  trend,
  icon,
  className,
}: StatCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNeutral = trend && trend.value === 0;

  return (
    <Card className={cn(className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                {isNeutral ? (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                ) : isPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span
                  className={cn(
                    isNeutral && "text-muted-foreground",
                    isPositive && "text-emerald-500",
                    !isPositive && !isNeutral && "text-destructive",
                  )}
                >
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2 bg-muted rounded-md text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
