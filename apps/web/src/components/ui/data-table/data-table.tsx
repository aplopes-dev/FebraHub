"use client";

import Link from "next/link";
import {
  DataTable as MuiDataTable,
  type DataTableColumn,
  type DataTableProps as MuiDataTableProps,
} from "@/ui";

export type { DataTableColumn };

export type DataTableProps<T> = MuiDataTableProps<T>;

const DEFAULT_PER_PAGE_OPTIONS = [10, 25, 50] as const;

/**
 * DataTable padrão das listagens do sistema.
 *
 * Wrapper fino sobre `@/ui` com defaults do app (paginação 1-based
 * server-side, labels PT-BR, opções de página). Preferir este import a
 * consumir `DataTable` de `@/ui` direto nas features.
 *
 * `getRowHref` usa `next/link` por padrão — dispara o `nextjs-toploader`.
 *
 */
export function DataTable<T>({
  emptyMessage = "Nenhum registro encontrado.",
  pagination,
  linkComponent = Link,
  ...props
}: DataTableProps<T>) {
  return (
    <MuiDataTable
      {...props}
      linkComponent={linkComponent}
      emptyMessage={emptyMessage}
      pagination={
        pagination
          ? {
              perPageOptions: [...DEFAULT_PER_PAGE_OPTIONS],
              ...pagination,
            }
          : undefined
      }
    />
  );
}
