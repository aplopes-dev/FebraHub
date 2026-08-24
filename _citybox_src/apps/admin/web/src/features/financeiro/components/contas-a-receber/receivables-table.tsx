"use client";

import { useMemo, useState, useEffect } from "react";
import { DataTable } from "@citybox/ui/organisms";
import type {
  FilterValues,
  CheckboxFilterValue,
  DatePresetFilterValue,
  DateRange,
} from "@citybox/ui/organisms";
import { getReceivablesColumns } from "./receivables-columns";
import { useFinanceInvoices } from "../../hooks/use-finance-queries";

interface ReceivablesTableProps {
  filters?: FilterValues;
  search?: string;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isDateRange(value: unknown): value is DateRange {
  return (
    value !== null &&
    typeof value === "object" &&
    ("from" in (value as Record<string, unknown>) || "to" in (value as Record<string, unknown>))
  );
}

export function getDateBounds(
  preset: string | null,
  date: Date | DateRange | null | undefined,
): { from: string; to: string } | null {
  if (!preset) return null;
  const today = new Date();
  const todayStr = toDateStr(today);

  switch (preset) {
    case "hoje":
      return { from: todayStr, to: todayStr };
    case "esta-semana": {
      const from = new Date(today);
      from.setDate(today.getDate() - today.getDay());
      return { from: toDateStr(from), to: todayStr };
    }
    case "este-mes": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toDateStr(from), to: todayStr };
    }
    case "data-especifica": {
      if (!date) return null;
      if (isDateRange(date)) {
        if (!date.from || !date.to) return null;
        return { from: toDateStr(date.from), to: toDateStr(date.to) };
      }
      const dateStr = toDateStr(date as Date);
      return { from: dateStr, to: dateStr };
    }
    default:
      return null;
  }
}

export function ReceivablesTable({ filters, search }: ReceivablesTableProps) {
  const columns = getReceivablesColumns();
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  // Reset page to 0 when filters or search change
  useEffect(() => {
    setPageIndex(0);
  }, [filters, search]);

  const statusValues = useMemo(() => {
    return ((filters?.["status"] as CheckboxFilterValue) ?? []) as string[];
  }, [filters]);

  const methodValues = useMemo(() => {
    return ((filters?.["method"] as CheckboxFilterValue) ?? []) as string[];
  }, [filters]);

  const dateVal = (filters?.["dueDate"] as DatePresetFilterValue) ?? { preset: null };
  const isDateSpecificWithoutValue = dateVal.preset === "data-especifica" && !dateVal.date;

  const dateBounds = useMemo(() => {
    return getDateBounds(dateVal.preset, dateVal.date);
  }, [dateVal.preset, dateVal.date]);

  const { data: invoicesRes, isLoading } = useFinanceInvoices({
    page: pageIndex + 1,
    perPage: pageSize,
    status: statusValues.length > 0 ? statusValues : undefined,
    method: methodValues.length > 0 ? methodValues : undefined,
    search: search || undefined,
    startDate: dateBounds?.from,
    endDate: dateBounds?.to,
    enabled: !isDateSpecificWithoutValue,
  });

  if (isLoading && !isDateSpecificWithoutValue) {
    return <div className="h-48 bg-muted/40 animate-pulse rounded-lg" />;
  }

  const data = invoicesRes?.data ?? [];
  const total = invoicesRes?.meta?.total ?? 0;
  const pageCount = invoicesRes?.meta?.totalPages ?? 0;

  return (
    <DataTable
      columns={columns}
      data={data}
      manualPagination={true}
      pageIndex={pageIndex}
      pageCount={pageCount}
      totalRowCount={total}
      onPageIndexChange={setPageIndex}
      pageSize={pageSize}
      entityName="faturas"
    />
  );
}
