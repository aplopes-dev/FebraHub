"use client";

import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingDown,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Eye,
  Trash2,
  XCircle,
  FileText,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import {
  paymentMethodLabel,
  paymentMethodBadgeClass,
} from "../lib/payment-method-labels";
import type { FinancialEntry } from "../types";

interface TransactionsDetailTableProps {
  entries: FinancialEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onView?: (entry: FinancialEntry) => void;
  onDelete?: (entry: FinancialEntry) => void;
  onCancelPayment?: (entry: FinancialEntry) => void;
  onEmitReceipt?: (entry: FinancialEntry) => void;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function PaymentMethodToggle({ method }: { method: string | null }) {
  const label = paymentMethodLabel(method);
  if (!method) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        paymentMethodBadgeClass(method),
      )}
      aria-label={`Meio de pagamento: ${label}`}
    >
      {label}
    </span>
  );
}

function displayDate(entry: FinancialEntry): string {
  const iso = (entry.paidAt ?? entry.dueDate).substring(0, 10);
  return format(parseISO(iso), "dd/MM/yyyy", { locale: ptBR });
}

export function TransactionsDetailTable({
  entries,
  total,
  page,
  perPage,
  totalPages,
  onPageChange,
  onPerPageChange,
  onView,
  onDelete,
  onCancelPayment,
  onEmitReceipt,
  className,
}: TransactionsDetailTableProps) {
  const [pageSize, setPageSize] = useState(perPage);

  useEffect(() => {
    setPageSize(perPage);
  }, [perPage]);

  const handlePageSizeChange = (newSize: string) => {
    const size = Number(newSize);
    setPageSize(size);
    onPerPageChange(size);
  };

  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border md:min-h-0",
        className,
      )}
    >
      <div className="overflow-x-auto overflow-y-visible md:min-h-0 md:flex-1 md:overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>Data</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Meio</TableHead>
            <TableHead className="text-right">Valor bruto</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-8 text-muted-foreground"
              >
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => {
              const isIncome = entry.type === "income";
              const displayName = entry.patient?.name || entry.description;
              const canCancel =
                entry.status === "paid" || entry.status === "received";

              return (
                <TableRow key={entry.id}>
                  <TableCell>
                    {isIncome ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {displayDate(entry)}
                  </TableCell>
                  <TableCell>{displayName}</TableCell>
                  <TableCell>
                    <PaymentMethodToggle method={entry.paymentMethod} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      isIncome ? "text-green-700" : "text-red-700",
                    )}
                  >
                    {isIncome ? "" : "−"}
                    {formatCurrency(entry.value)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label="Ações"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(entry)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </DropdownMenuItem>
                        )}

                        {isIncome && onEmitReceipt && (
                          <DropdownMenuItem
                            onClick={() => onEmitReceipt(entry)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Emitir recibo
                          </DropdownMenuItem>
                        )}

                        {onCancelPayment && canCancel && (
                          <DropdownMenuItem
                            onClick={() => onCancelPayment(entry)}
                            className="text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            {isIncome
                              ? "Cancelar recebimento"
                              : "Cancelar pagamento"}
                          </DropdownMenuItem>
                        )}

                        {!isIncome && onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(entry)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      </div>

      {total > 0 && (
        <div className="flex shrink-0 flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {total} registro(s) no total
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <p className="whitespace-nowrap text-sm font-medium">
                <span className="xl:hidden">Por página</span>
                <span className="hidden xl:inline">Linhas por página</span>
              </p>
              <Select
                value={`${pageSize}`}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={`${size}`}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-center text-sm font-medium">
              Página {Math.min(page, safeTotalPages)} de {safeTotalPages}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  onPageChange(Math.min(safeTotalPages, page + 1))
                }
                disabled={page >= safeTotalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(safeTotalPages)}
                disabled={page >= safeTotalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
