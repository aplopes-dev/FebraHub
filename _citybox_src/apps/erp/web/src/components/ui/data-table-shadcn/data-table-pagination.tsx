"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

function buildPageNumbers(
  pageIndex: number,
  pageCount: number,
): Array<number | "ellipsis"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i);
  }

  const current = pageIndex;
  const pages = new Set<number>();
  pages.add(0);
  pages.add(pageCount - 1);
  for (let i = current - 1; i <= current + 1; i += 1) {
    if (i >= 0 && i < pageCount) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    const page = sorted[i]!;
    if (i > 0) {
      const prev = sorted[i - 1]!;
      if (page - prev > 1) result.push("ellipsis");
    }
    result.push(page);
  }
  return result;
}

export type DataTablePaginationProps = {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageIndexChange: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
};

export function DataTablePagination({
  pageIndex,
  pageCount,
  pageSize,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageIndexChange,
  onPageSizeChange,
  className,
}: DataTablePaginationProps) {
  const safePageCount = Math.max(pageCount, 1);
  const pages = buildPageNumbers(pageIndex, safePageCount);
  const canPrevious = pageIndex > 0;
  const canNext = pageIndex < safePageCount - 1;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Itens por página</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange?.(Number(value))}
          disabled={!onPageSizeChange}
        >
          <SelectTrigger size="sm" className="h-8 w-[4.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={!canPrevious}
          aria-label="Página anterior"
          onClick={() => onPageIndexChange(pageIndex - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "size-8 text-sm",
                item === pageIndex &&
                  "bg-primary/10 font-semibold text-primary hover:bg-primary/15 hover:text-primary",
              )}
              aria-label={`Página ${item + 1}`}
              aria-current={item === pageIndex ? "page" : undefined}
              onClick={() => onPageIndexChange(item)}
            >
              {item + 1}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          disabled={!canNext}
          aria-label="Próxima página"
          onClick={() => onPageIndexChange(pageIndex + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
