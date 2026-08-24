"use client";

import { Skeleton } from "@citybox/ui/atoms";

export function StoreDetailSkeleton() {
  return (
    <div className="-mx-4 -mb-4 -mt-4 flex min-h-full flex-1 flex-col">
      <div className="bg-card px-6 py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Skeleton className="size-16 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 max-w-full" />
            <div className="flex flex-wrap gap-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b bg-card px-6 py-3">
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-20" />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-muted/40 p-4">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
