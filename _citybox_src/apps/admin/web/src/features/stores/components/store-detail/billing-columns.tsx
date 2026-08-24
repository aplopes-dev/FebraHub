"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { formatCurrency, formatDateIso } from "@/lib/format-currency";
import type { StoreInvoice } from "../../types";
import { invoiceStatusConfig } from "../../lib/status-config";

export function getBillingColumns(): ColumnDef<StoreInvoice>[] {
  return [
    {
      id: "periodo",
      header: () => <div className="text-center">Período</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-sm">
            {formatDateIso(row.original.periodStart.split("T")[0])} –{" "}
            {formatDateIso(row.original.periodEnd.split("T")[0])}
          </span>
        </div>
      ),
    },
    {
      id: "vencimento",
      accessorKey: "dueDate",
      header: () => <div className="text-center">Vencimento</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-sm">{formatDateIso(row.original.dueDate.split("T")[0])}</span>
        </div>
      ),
    },
    {
      id: "valor",
      accessorKey: "amountCents",
      header: () => <div className="text-center">Valor</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <span className="text-sm tabular-nums">{formatCurrency(row.original.amountCents)}</span>
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => {
        const { label, className } = invoiceStatusConfig[row.original.status];
        return (
          <div className="flex justify-center">
            <Badge variant="outline" className={cn("w-fit text-xs font-medium", className)}>
              {label}
            </Badge>
          </div>
        );
      },
    },
  ];
}
