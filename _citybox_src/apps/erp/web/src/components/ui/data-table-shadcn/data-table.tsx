"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ScrollArea,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { DataTablePagination } from "@/components/ui/data-table-shadcn/data-table-pagination";
import { DataTableSkeleton } from "@/components/ui/data-table-shadcn/data-table-skeleton";

export type { ColumnDef };

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  className?: string;
  /** Classes do ScrollArea da tabela (altura mínima auto por padrão). */
  scrollAreaClassName?: string;
  /** Classes extras por linha (ex.: highlight de seleção). */
  getRowClassName?: (row: TData) => string | undefined;
  /** Clique na linha (ex.: abrir detalhe). Evite em células com stopPropagation. */
  onRowClick?: (row: TData) => void;
  manualPagination?: boolean;
  pageIndex?: number;
  pageCount?: number;
  totalRowCount?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageIndexChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Mostra o `DataTableSkeleton` no lugar da tabela. Ligue a **toda**
   * requisição em andamento (carga inicial e troca de página) — é o feedback
   * padrão de "algo está acontecendo" para todas as tabelas do app.
   */
  isLoading?: boolean;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  scrollAreaClassName,
  getRowClassName,
  onRowClick,
  manualPagination = false,
  pageIndex = 0,
  pageCount: controlledPageCount,
  totalRowCount,
  pageSize = 10,
  pageSizeOptions,
  onPageIndexChange,
  onPageSizeChange,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const resolvedPageCount = manualPagination
    ? Math.max(
        controlledPageCount ?? 0,
        (totalRowCount ?? data.length) > 0
          ? Math.ceil((totalRowCount ?? data.length) / pageSize)
          : 0,
        1,
      )
    : Math.max(1, Math.ceil(data.length / pageSize) || 1);

  // TanStack Table API is incompatible with React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination,
    pageCount: resolvedPageCount,
    state: {
      pagination: { pageIndex, pageSize },
    },
  });

  if (isLoading) {
    return (
      <DataTableSkeleton
        columns={columns}
        rowCount={pageSize}
        showPagination={manualPagination}
        className={className}
        scrollAreaClassName={scrollAreaClassName}
      />
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-white dark:bg-card">
        <ScrollArea
          className={cn("h-auto min-h-0 flex-1", scrollAreaClassName)}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-[#f6f6f6] dark:bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b border-border hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-11 px-4 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "border-b border-border last:border-b-0 hover:bg-muted/20",
                      onRowClick && "cursor-pointer",
                      getRowClassName?.(row.original),
                    )}
                    onClick={
                      onRowClick
                        ? () => {
                            onRowClick(row.original);
                          }
                        : undefined
                    }
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              onRowClick(row.original);
                            }
                          }
                        : undefined
                    }
                    tabIndex={onRowClick ? 0 : undefined}
                    role={onRowClick ? "link" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-3.5 text-sm"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {manualPagination ? (
        <DataTablePagination
          className="shrink-0"
          pageIndex={pageIndex}
          pageCount={resolvedPageCount}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          onPageIndexChange={(next) => onPageIndexChange?.(next)}
          onPageSizeChange={onPageSizeChange}
        />
      ) : null}
    </div>
  );
}
