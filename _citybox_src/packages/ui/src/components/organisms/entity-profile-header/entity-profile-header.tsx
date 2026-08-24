import * as React from "react";
import { cn } from "../../../lib/utils";

export interface EntityProfileMetaItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export interface EntityProfileHeaderProps {
  avatar: React.ReactNode;
  title: string;
  meta: EntityProfileMetaItem[];
  aside?: React.ReactNode;
  titleAddon?: React.ReactNode;
  className?: string;
}

export function EntityProfileHeader({
  avatar,
  title,
  meta,
  aside,
  titleAddon,
  className,
}: EntityProfileHeaderProps) {
  return (
    <header
      className={cn(
        "w-full border-b bg-card px-6 py-6",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          {avatar}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {titleAddon}
            </div>
            {meta.length > 0 && (
              <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                {meta.map((item) => (
                  <li
                    key={item.label}
                    className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  );
}
