"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../atoms";
import { cn } from "../../../lib/utils";

export interface DataTablePaginationSummaryParams {
  firstRow: number;
  lastRow: number;
  totalRows: number;
  pageIndex: number;
  pageCount: number;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  /** Mensagem quando não há linhas */
  emptyMessage?: string;
  /** Texto quando totalRows === 0 na área de paginação */
  emptyPaginationLabel?: string;
  /** Sufixo opcional: "Exibindo 1–8 de 10 clientes" */
  entityName?: string;
  /** Customiza o texto de paginação (sobrescreve entityName) */
  formatPaginationSummary?: (
    params: DataTablePaginationSummaryParams,
  ) => string;
  /** Labels dos botões de paginação */
  previousPageLabel?: string;
  nextPageLabel?: string;
  /** Desabilita ordenação por coluna */
  enableSorting?: boolean;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  bodyClassName?: string;
  tableWrapperClassName?: string;
  /** Larguras de coluna (ex.: `<colgroup><col style={{ width: "30%" }} /></colgroup>`) */
  colgroup?: React.ReactNode;
  paginationClassName?: string;
  getRowClassName?: (row: TData) => string | undefined;
  /** Clique na linha (exceto em controles interativos dentro da célula). */
  onRowClick?: (row: TData) => void;
  /** Paginação server-side: dados já vêm fatiados por página */
  manualPagination?: boolean;
  /** Índice da página atual (0-based) */
  pageIndex?: number;
  /** Total de páginas (server) */
  pageCount?: number;
  /** Total de registros (server) */
  totalRowCount?: number;
  onPageIndexChange?: (pageIndex: number) => void;
}

const defaultTableClassName =
  "border-collapse [&_td]:border-r [&_td:last-child]:border-r-0 [&_tr]:border-border [&_td]:border-border [&_tbody_tr:last-child]:border-b";

const defaultHeaderClassName =
  "bg-secondary [&_tr]:border-b-0 [&_th]:border-r [&_th]:border-border [&_th:last-child]:border-r-0 [&_th]:text-center [&_th]:text-foreground/70";

function defaultPaginationSummary({
  firstRow,
  lastRow,
  totalRows,
  entityName,
}: DataTablePaginationSummaryParams & { entityName?: string }) {
  const range = `Exibindo ${firstRow}–${lastRow} de ${totalRows}`;
  return entityName ? `${range} ${entityName}` : range;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = "Nenhum resultado encontrado.",
  emptyPaginationLabel = "Sem dados",
  entityName,
  formatPaginationSummary,
  previousPageLabel = "Página anterior",
  nextPageLabel = "Próxima página",
  enableSorting = true,
  className,
  tableClassName,
  headerClassName,
  bodyClassName,
  tableWrapperClassName,
  colgroup,
  paginationClassName,
  getRowClassName,
  onRowClick,
  manualPagination = false,
  pageIndex: controlledPageIndex = 0,
  pageCount: controlledPageCount,
  totalRowCount,
  onPageIndexChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  /** Paginação client-side precisa de estado + onPaginationChange quando `sorting` é controlado. */
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    setPagination((current) =>
      current.pageSize === pageSize ? current : { pageIndex: 0, pageSize },
    );
  }, [pageSize]);

  const clientPageCount =
    !manualPagination && data.length > 0
      ? Math.ceil(data.length / pageSize)
      : 0;

  React.useEffect(() => {
    if (manualPagination) return;
    setPagination((current) => {
      if (clientPageCount <= 0) {
        return current.pageIndex === 0 ? current : { ...current, pageIndex: 0 };
      }
      const maxIndex = clientPageCount - 1;
      return current.pageIndex > maxIndex
        ? { ...current, pageIndex: maxIndex }
        : current;
    });
  }, [clientPageCount, manualPagination]);

  const manualPageCount = manualPagination
    ? Math.max(
        controlledPageCount ?? 0,
        (totalRowCount ?? data.length) > 0
          ? Math.ceil((totalRowCount ?? data.length) / pageSize)
          : 0,
      )
    : undefined;

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    enableSorting,
    manualPagination,
    pageCount: manualPageCount,
    onPaginationChange: manualPagination
      ? (updater) => {
          const current = { pageIndex: controlledPageIndex, pageSize };
          const next = typeof updater === "function" ? updater(current) : updater;
          if (next.pageIndex !== controlledPageIndex) {
            onPageIndexChange?.(next.pageIndex);
          }
        }
      : setPagination,
    state: {
      sorting,
      pagination: manualPagination
        ? { pageIndex: controlledPageIndex, pageSize }
        : pagination,
    },
  });

  const { pageIndex, pageSize: currentPageSize } = manualPagination
    ? { pageIndex: controlledPageIndex, pageSize }
    : pagination;
  const totalRows = manualPagination
    ? (totalRowCount ?? data.length)
    : table.getFilteredRowModel().rows.length;
  const firstRow = totalRows > 0 ? pageIndex * currentPageSize + 1 : 0;
  const lastRow = Math.min((pageIndex + 1) * currentPageSize, totalRows);
  const resolvedPageCount = manualPagination
    ? (manualPageCount ?? 0)
    : table.getPageCount();
  const pageCount = Math.max(resolvedPageCount, 1);

  const canPreviousPage = manualPagination ? pageIndex > 0 : table.getCanPreviousPage();
  const canNextPage = manualPagination
    ? pageIndex < resolvedPageCount - 1
    : table.getCanNextPage();

  const goToPreviousPage = () => {
    if (manualPagination) {
      onPageIndexChange?.(pageIndex - 1);
      return;
    }
    table.previousPage();
  };

  const goToNextPage = () => {
    if (manualPagination) {
      onPageIndexChange?.(pageIndex + 1);
      return;
    }
    table.nextPage();
  };

  const paginationSummary =
    totalRows > 0
      ? (
          formatPaginationSummary ??
          ((params) => defaultPaginationSummary({ ...params, entityName }))
        )({
          firstRow,
          lastRow,
          totalRows,
          pageIndex,
          pageCount,
        })
      : emptyPaginationLabel;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className={cn("overflow-hidden rounded-lg", tableWrapperClassName)}>
        <Table className={cn(defaultTableClassName, tableClassName)}>
          {colgroup}
          <TableHeader className={cn(defaultHeaderClassName, headerClassName)}>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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

          <TableBody className={bodyClassName}>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    getRowClassName?.(row.original),
                    onRowClick && "cursor-pointer hover:bg-muted/40",
                  )}
                  onClick={
                    onRowClick
                      ? () => {
                          onRowClick(row.original);
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 max-w-none! overflow-visible! text-center! text-secondary-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div
        className={cn(
          "flex items-center justify-between text-sm text-secondary-foreground",
          paginationClassName,
        )}
      >
        <span>{paginationSummary}</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToPreviousPage}
            disabled={!canPreviousPage}
            aria-label={previousPageLabel}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {pageIndex + 1} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextPage}
            disabled={!canNextPage}
            aria-label={nextPageLabel}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ColumnDef, SortingState };
