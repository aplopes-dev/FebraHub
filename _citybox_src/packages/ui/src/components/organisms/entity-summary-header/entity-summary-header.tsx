import * as React from "react";
import { Card, CardContent } from "../../atoms/card";
import { Separator } from "../../atoms/separator";
import { cn } from "../../../lib/utils";

export interface EntitySummaryMetric {
  label: string;
  value: React.ReactNode;
}

export interface EntitySummaryHeaderProps {
  identity: React.ReactNode;
  badges?: React.ReactNode;
  metrics?: EntitySummaryMetric[];
  actions?: React.ReactNode;
  dangerAction?: React.ReactNode;
  className?: string;
}

export function EntitySummaryHeader({
  identity,
  badges,
  metrics,
  actions,
  dangerAction,
  className,
}: EntitySummaryHeaderProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {identity}
            {badges && <div className="flex flex-wrap items-center gap-2">{badges}</div>}
            {metrics && metrics.length > 0 && (
              <div className="flex flex-wrap gap-6">
                {metrics.map((metric) => (
                  <div key={metric.label} className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className="text-lg font-semibold tabular-nums">{metric.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(actions || dangerAction) && (
            <div className="flex shrink-0 flex-col gap-3 lg:items-end">
              {actions && (
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div>
              )}
              {dangerAction && (
                <>
                  <Separator className="hidden lg:block" />
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {dangerAction}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
