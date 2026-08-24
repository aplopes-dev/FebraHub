"use client";

import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import type { BoxProps } from "@mui/material/Box";
import type { ElementType, ReactNode } from "react";
import { Skeleton } from "../../atoms/skeleton";
import { ScrollArea } from "../../molecules/scroll-area";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  align?: "left" | "center" | "right";
  width?: number | string;
  render: (row: T) => ReactNode;
};

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage?: string;
  /** Exibe skeleton nas linhas enquanto carrega. */
  isLoading?: boolean;
  /** Quantidade de linhas skeleton. Default: `pagination.perPage` ou 5. */
  loadingRowCount?: number;
  /**
   * Clique na linha (callback). Preferir `getRowHref` quando a navegação
   * for uma rota — assim o progresso (ex.: nextjs-toploader) intercepta o `<a>`.
   */
  onRowClick?: (row: T) => void;
  /**
   * Torna a linha clicável via link (`<a>` / `Link`) esticado sobre a `<tr>`
   * (HTML válido — a linha continua sendo `<tr>`, nunca `component={Link}`).
   * Tem precedência sobre `onRowClick`.
   * Controles internos (checkbox, menu ⋯) precisam de `pointer-events: auto`
   * (já aplicado pelo DataTable) e, se necessário, `stopRowNavigation`.
   */
  getRowHref?: (row: T) => string | undefined;
  /**
   * Componente do link da linha (default `"a"`).
   * No Next App Router, passe `Link` de `next/link`.
   */
  linkComponent?: ElementType;
  getRowClassName?: (row: T) => string;
  /**
   * Estilos do container externo (flex). Use para preencher altura do pai
   * (`flex: 1`, `minHeight: 0`) — padrão já inclui isso.
   */
  sx?: BoxProps["sx"];
  /** Paginação controlada (server-side). Omitir para tabela sem paginação. */
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    perPageOptions?: number[];
  };
};

const tableLayoutSx = {
  tableLayout: "fixed" as const,
  width: "100%",
};

/** Paridade com `TableHead` shadcn: h-11 · px-4 · uppercase · fundo muted. */
const headerCellSx = {
  bgcolor: "action.hover",
  fontWeight: 600,
  fontSize: "0.75rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  color: "text.secondary",
  height: 44,
  minHeight: 44,
  boxSizing: "border-box" as const,
  px: 2,
  py: 0,
  whiteSpace: "nowrap" as const,
};

function headerCellSxForColumn<T>(column: DataTableColumn<T>) {
  if (column.width === 48) {
    return {
      ...headerCellSx,
      px: 0.5,
      width: 48,
    };
  }

  return headerCellSx;
}

/** Padding compartilhado — skeleton e dados precisam bater na mesma altura. */
const bodyCellSx = {
  py: 1,
  /**
   * Altura mínima das linhas de listagem (= thumbnail 40px + padding).
   * Garante paridade visual entre tabelas com/sem avatar (produtos vs categorias).
   */
  height: 56,
  boxSizing: "border-box" as const,
} as const;

/** Altura do bloco skeleton ≈ conteúdo típico de linha (ex.: avatar 40px). */
const SKELETON_BLOCK_HEIGHT = 40;

function ColGroup<T>({ columns }: { columns: DataTableColumn<T>[] }) {
  return (
    <colgroup>
      {columns.map((column) => (
        <col
          key={column.id}
          style={column.width != null ? { width: column.width } : undefined}
        />
      ))}
    </colgroup>
  );
}

/**
 * Tabela com header fixo, body rolável e paginação no rodapé
 * (mesmo padrão do DataTable shadcn + ScrollArea do erp-comercio).
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage = "Nenhum registro encontrado.",
  isLoading = false,
  loadingRowCount,
  onRowClick,
  getRowHref,
  linkComponent = "a",
  getRowClassName,
  sx,
  pagination,
}: DataTableProps<T>) {
  const skeletonCount = loadingRowCount ?? pagination?.perPage ?? 5;

  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          gap: 2,
          width: "100%",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header fixo — fora do scroll. */}
        <Box
          sx={{
            flexShrink: 0,
            overflow: "hidden",
            bgcolor: "action.hover",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Table size="small" sx={tableLayoutSx}>
            <ColGroup columns={columns} />
            <TableHead>
              <TableRow
                sx={{
                  "&:hover": {
                    bgcolor: "transparent",
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align ?? "left"}
                    sx={headerCellSxForColumn(column)}
                  >
                    {column.header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>
        </Box>

        {/* Body — único trecho com scroll. */}
        <ScrollArea sx={{ flex: 1 }}>
          <Table size="small" sx={tableLayoutSx}>
            <ColGroup columns={columns} />
            <TableBody>
              {isLoading ? (
                Array.from({ length: skeletonCount }, (_, rowIndex) => (
                  <TableRow key={`skeleton-${rowIndex}`}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align ?? "left"}
                        sx={bodyCellSx}
                      >
                        <Skeleton
                          variant="rounded"
                          width="80%"
                          height={SKELETON_BLOCK_HEIGHT}
                          sx={{
                            maxWidth: 240,
                            transform: "none",
                            borderRadius: 1,
                          }}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    align="center"
                    sx={{ py: 6, color: "text.secondary" }}
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const href = getRowHref?.(row);
                  const isLinkRow = Boolean(href);
                  return (
                    <TableRow
                      key={getRowId(row)}
                      hover
                      className={getRowClassName?.(row)}
                      onClick={
                        !isLinkRow && onRowClick
                          ? () => onRowClick(row)
                          : undefined
                      }
                      sx={
                        isLinkRow || onRowClick
                          ? {
                              cursor: "pointer",
                              // Containing block for the stretched row link
                              // (must stay a real `<tr>` — never `component={Link}`).
                              ...(isLinkRow ? { position: "relative" } : null),
                            }
                          : undefined
                      }
                    >
                      {columns.map((column, columnIndex) => (
                        <TableCell
                          key={column.id}
                          align={column.align ?? "left"}
                          sx={bodyCellSx}
                        >
                          {isLinkRow && columnIndex === 0 && href ? (
                            <Box
                              component={linkComponent}
                              href={href}
                              aria-label="Abrir registro"
                              // Covers the whole row (tr is position:relative).
                              // Content uses pointer-events so controls stay clickable.
                              sx={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 0,
                              }}
                            />
                          ) : null}
                          <Box
                            sx={
                              isLinkRow
                                ? {
                                    position: "relative",
                                    zIndex: 1,
                                    pointerEvents: "none",
                                    "& button, & a, & input, & textarea, & select, & label, & [role='button'], & [role='menuitem'], & [role='checkbox'], & .MuiButtonBase-root, & .MuiCheckbox-root, & .MuiIconButton-root, & .MuiSwitch-root":
                                      {
                                        pointerEvents: "auto",
                                      },
                                  }
                                : undefined
                            }
                          >
                            {column.render(row)}
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Paper>

      {pagination ? (
        <TablePagination
          component="div"
          count={pagination.total}
          page={Math.max(pagination.page - 1, 0)}
          rowsPerPage={pagination.perPage}
          onPageChange={(_, nextPage) => pagination.onPageChange(nextPage + 1)}
          onRowsPerPageChange={
            pagination.onPerPageChange
              ? (event) =>
                  pagination.onPerPageChange?.(Number(event.target.value))
              : undefined
          }
          rowsPerPageOptions={pagination.perPageOptions ?? [10, 25, 50]}
          labelRowsPerPage="Por página"
          labelDisplayedRows={({ from, to, count }) =>
            count === -1 ? `${from}–${to}` : `${from}–${to} de ${count}`
          }
          getItemAriaLabel={(type) => {
            if (type === "first") return "Primeira página";
            if (type === "last") return "Última página";
            if (type === "next") return "Próxima página";
            return "Página anterior";
          }}
          sx={{
            flexShrink: 0,
            border: 0,
            width: "100%",
            ".MuiToolbar-root": {
              minHeight: 52,
              px: 0,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
            },
            // Remove o spacer que empurra tudo para a direita.
            ".MuiTablePagination-spacer": {
              display: "none",
            },
            // "1–10 de N" + setas ficam na ponta direita.
            ".MuiTablePagination-displayedRows": {
              marginLeft: "auto",
            },
          }}
        />
      ) : null}
    </Box>
  );
}
