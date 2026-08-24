"use client";

import Link from "next/link";
import {
  DataTable as MuiDataTable,
  type DataTableColumn,
  type DataTableProps as MuiDataTableProps,
} from "@citybox/mui";

export type { DataTableColumn };

export type DataTableProps<T> = MuiDataTableProps<T>;

const DEFAULT_PER_PAGE_OPTIONS = [10, 25, 50] as const;

/**
 * DataTable padrão do ERP Comércio.
 *
 * Wrapper fino sobre `@citybox/mui` com defaults do app (paginação 1-based
 * server-side, labels PT-BR, opções de página). Preferir este import a
 * consumir `DataTable` de `@citybox/mui` direto nas features.
 *
 * `getRowHref` usa `next/link` por padrão — dispara o `nextjs-toploader`.
 *
 * Features ainda em `@citybox/ui`/TanStack usam `@/components/ui/data-table-shadcn`.
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
