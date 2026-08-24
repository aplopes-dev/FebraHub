import * as React from "react";
import { cn } from "../../../lib/utils";

export interface AuditTimelineEntry {
  id: string;
  date: Date | string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface AuditTimelineProps {
  entries: AuditTimelineEntry[];
  className?: string;
}

function formatAuditDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

export function AuditTimeline({ entries, className }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Nenhum registro de auditoria encontrado.
      </p>
    );
  }

  return (
    <div className={cn("relative space-y-0", className)}>
      {entries.map((entry, index) => (
        <div key={entry.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < entries.length - 1 && (
            <span
              aria-hidden
              className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-border"
            />
          )}

          <div className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
            {entry.icon ?? <span className="h-2 w-2 rounded-full bg-primary" />}
          </div>

          <div className="min-w-0 flex-1 space-y-1 pt-0.5">
            <p className="text-xs tabular-nums text-muted-foreground">
              {formatAuditDate(entry.date)}
            </p>
            <p className="text-sm font-medium leading-snug">{entry.title}</p>
            {entry.description && (
              <p className="text-sm text-muted-foreground">{entry.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
