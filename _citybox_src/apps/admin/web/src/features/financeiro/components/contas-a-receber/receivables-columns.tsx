"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Invoice } from "../../types";
import {
  InvoiceCell,
  ClientNameCell,
  DueDateCell,
  AmountCell,
  MethodCell,
  InvoiceStatusCell,
} from "./receivables-table-cells";
import { ReceivablesActionsMenu } from "./receivables-actions-menu";

export function getReceivablesColumns(): ColumnDef<Invoice>[] {
  return [
    {
      id: "fatura",
      accessorFn: (row) => row.id,
      header: "Fatura / Ref",
      cell: ({ row }) => <InvoiceCell invoice={row.original} />,
    },
    {
      id: "cliente",
      accessorKey: "clientName",
      header: "Cliente",
      cell: ({ row }) => <ClientNameCell invoice={row.original} />,
    },
    {
      id: "vencimento",
      accessorKey: "dueDate",
      header: "Vencimento",
      cell: ({ row }) => <DueDateCell invoice={row.original} />,
    },
    {
      id: "valor",
      accessorKey: "amountCents",
      header: "Valor",
      cell: ({ row }) => <AmountCell amount={row.original.amountCents} />,
    },
    {
      id: "metodo",
      accessorKey: "method",
      header: "Método",
      cell: ({ row }) => <MethodCell method={row.original.method} />,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <InvoiceStatusCell status={row.original.status} />,
    },
    {
      id: "acoes",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ReceivablesActionsMenu invoice={row.original} />
        </div>
      ),
    },
  ];
}
