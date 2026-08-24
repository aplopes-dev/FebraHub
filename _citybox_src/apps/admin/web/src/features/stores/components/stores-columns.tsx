"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Loja } from "../types";
import {
  LojaCell,
  VerticalCell,
  ClientGroupCell,
  LojaStatusCell,
  CreatedAtCell,
} from "./stores-table-cells";
import { StoreActionsMenu } from "./store-actions-menu";

interface GetColumnsOptions {
  onEdit?: (loja: Loja) => void;
  onImpersonate?: (loja: Loja) => void;
  onBlock?: (loja: Loja) => void;
}

export function getStoresColumns({
  onEdit,
  onImpersonate,
  onBlock,
}: GetColumnsOptions = {}): ColumnDef<Loja>[] {
  return [
    {
      id: "loja",
      accessorFn: (row) => row.tradeName,
      header: "Loja",
      cell: ({ row }) => <LojaCell loja={row.original} href={`/clientes/${row.original.id}`} />,
    },
    {
      id: "vertical",
      accessorKey: "vertical",
      header: "Vertical",
      cell: ({ row }) => <VerticalCell vertical={row.original.vertical} />,
    },
    {
      id: "cliente",
      accessorKey: "clientName",
      header: "Cliente (Grupo)",
      cell: ({ row }) => (
        <ClientGroupCell clientName={row.original.clientName} />
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <LojaStatusCell status={row.original.status} />,
    },
    {
      id: "criadaEm",
      accessorKey: "createdAt",
      header: "Criada em",
      cell: ({ row }) => <CreatedAtCell dateIso={row.original.createdAt} />,
    },
    {
      id: "acoes",
      header: "",
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <StoreActionsMenu
            loja={row.original}
            onEdit={onEdit}
            onImpersonate={onImpersonate}
            onBlock={onBlock}
          />
        </div>
      ),
    },
  ];
}
