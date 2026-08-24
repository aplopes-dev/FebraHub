"use client";

import type { HTMLAttributes, ReactNode, TimeHTMLAttributes } from "react";
import { cn } from "@citybox/ui";

/**
 * Timeline mínima vendorizada — substitui o `@/components/ui/timeline` do
 * OdontoTech, que não existe no `@citybox/ui`. Reproduz apenas o subconjunto de
 * componentes usado pelo histórico da oportunidade, com Tailwind.
 */

export function Timeline({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative flex flex-col", className)} {...props} />;
}

export function TimelineItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("relative flex gap-3 pb-6 last:pb-0", className)}
      {...props}
    />
  );
}

export function TimelineDot({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative z-10 flex size-[var(--timeline-dot-size,2rem)] shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TimelineConnector({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute left-[calc(var(--timeline-dot-size,2rem)/2)] top-[var(--timeline-dot-size,2rem)] bottom-0 w-px -translate-x-1/2 bg-border",
        className,
      )}
      {...props}
    />
  );
}

export function TimelineContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 pt-0.5", className)} {...props} />;
}

export function TimelineHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-0.5", className)}
      {...props}
    />
  );
}

export function TimelineTime({
  className,
  children,
  ...props
}: TimeHTMLAttributes<HTMLTimeElement> & { children?: ReactNode }) {
  return (
    <time className={cn("text-xs text-muted-foreground", className)} {...props}>
      {children}
    </time>
  );
}

export function TimelineTitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("font-medium", className)} {...props} />;
}

export function TimelineDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}
