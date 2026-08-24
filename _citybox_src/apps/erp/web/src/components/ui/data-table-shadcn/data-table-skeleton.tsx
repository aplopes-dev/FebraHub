"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ScrollArea,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";

// Referência estável — um array literal inline recriaria a cada render e
// quebraria a memoização interna do TanStack Table.
const EMPTY_DATA: never[] = [];

// Larguras variadas por coluna, cicladas por índice — evita o efeito "muro"
// de barras idênticas e ainda assim não exige configuração por tabela.
const BODY_BAR_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-2/5", "w-5/6"];

export type DataTableSkeletonProps<TData, TValue> = {
  /** Mesmas `columns` passadas ao `DataTable` real — garante o cabeçalho idêntico. */
  columns: ColumnDef<TData, TValue>[];
  /** Linhas fantasma a exibir. Combine com o `pageSize` atual para não "pular" ao carregar. */
  rowCount?: number;
  className?: string;
  scrollAreaClassName?: string;
  /** A maioria das tabelas deste app pagina — default `true`. */
  showPagination?: boolean;
};

export function DataTableSkeleton<TData, TValue>({
  columns,
  rowCount = 10,
  className,
  scrollAreaClassName,
  showPagination = true,
}: DataTableSkeletonProps<TData, TValue>) {
  // Mesma ressalva do DataTable real: API do TanStack Table é incompatível
  // com a memoização do React Compiler.
  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable
  const table = useReactTable({
    data: EMPTY_DATA as TData[],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col gap-4", className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Carregando dados"
    >
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
              {Array.from({ length: rowCount }, (_, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className="border-b border-border last:border-b-0 hover:bg-transparent"
                >
                  {columns.map((_, columnIndex) => (
                    <TableCell key={columnIndex} className="px-4 py-3.5">
                      <Skeleton
                        className={cn(
                          "h-4",
                          BODY_BAR_WIDTHS[columnIndex % BODY_BAR_WIDTHS.length],
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {showPagination ? (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-36" />
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="size-8 rounded-md" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
