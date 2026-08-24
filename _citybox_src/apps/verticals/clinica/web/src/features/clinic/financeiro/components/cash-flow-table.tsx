"use client";

import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Edit,
  Trash2,
  FileText,
  XCircle,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { patientDetailDefaultHref } from "@/features/clinic/modules/patients/lib/patient-detail-tabs";
import {
  paymentMethodBadgeClass,
  paymentMethodLabel,
} from "../lib/payment-method-labels";
import type { FinancialEntry } from "../types";

interface CashFlowTableProps {
  entries: FinancialEntry[];
  onPay?: (entry: FinancialEntry) => void;
  onReceive?: (entry: FinancialEntry) => void;
  /** Se omitido, qualquer receita pendente com `onReceive` mostra Receber. */
  canReceiveEntry?: (entry: FinancialEntry) => boolean;
  onEdit?: (entry: FinancialEntry) => void;
  onDelete?: (entry: FinancialEntry) => void;
  onViewPayment?: (entry: FinancialEntry) => void;
  onEmitReceipt?: (entry: FinancialEntry) => void;
  onCancelPayment?: (entry: FinancialEntry) => void;
  className?: string;
}

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

function PaymentMethodBadge({ method }: { method: string | null }) {
  if (!method) {
    return null;
  }

  const label = paymentMethodLabel(method);

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

export function CashFlowTable({
  entries,
  onPay,
  onReceive,
  canReceiveEntry,
  onEdit,
  onDelete,
  onViewPayment,
  onEmitReceipt,
  onCancelPayment,
  className,
}: CashFlowTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: "dueDate" | "description" | "value";
    direction: "asc" | "desc";
  }>({ key: "dueDate", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSort = (key: "dueDate" | "description" | "value") => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPage(1);
  };

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      // Pendentes/vencidos primeiro, depois pagos/recebidos, cancelados por último
      const statusOrder = (e: FinancialEntry) => {
        if (e.status === "pending") return e.isOverdue ? 0 : 1;
        if (e.status === "paid" || e.status === "received") return 2;
        return 3;
      };
      const statusDiff = statusOrder(a) - statusOrder(b);
      if (statusDiff !== 0) return statusDiff;

      let aValue: string | number;
      let bValue: string | number;

      switch (sortConfig.key) {
        case "dueDate":
          aValue = a.dueDate;
          bValue = b.dueDate;
          break;
        case "description":
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case "value":
          aValue = a.value;
          bValue = b.value;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [entries, sortConfig]);

  const totalPages = Math.ceil(sortedEntries.length / pageSize);
  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedEntries.slice(startIndex, startIndex + pageSize);
  }, [sortedEntries, currentPage, pageSize]);

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatCPF = (cpf?: string | null) => {
    if (!cpf) return "";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const allSelected =
    paginatedEntries.length > 0 &&
    paginatedEntries.every((entry) => selectedRows.has(entry.id));

  const handleSelectAll = (checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      paginatedEntries.forEach((entry) => newSelected.add(entry.id));
    } else {
      paginatedEntries.forEach((entry) => newSelected.delete(entry.id));
    }
    setSelectedRows(newSelected);
  };

  return (
    <TooltipProvider delayDuration={200}>
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
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleSort("dueDate")}
              >
                Data
                {sortConfig.key === "dueDate" && (
                  <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                )}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => handleSort("description")}
              >
                Nome
                {sortConfig.key === "description" && (
                  <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                )}
              </Button>
            </TableHead>
            <TableHead>
              <div className="flex items-center justify-end gap-2">
                <div className="min-w-[5.75rem] shrink-0" aria-hidden />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 min-w-[5.5rem] justify-end px-0"
                  onClick={() => handleSort("value")}
                >
                  Valor
                  {sortConfig.key === "value" && (
                    <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                  )}
                </Button>
                <div className="w-[5.5rem] shrink-0" aria-hidden />
              </div>
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedEntries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                Nenhum registro encontrado
              </TableCell>
            </TableRow>
          ) : (
            paginatedEntries.map((entry) => {
              const isSelected = selectedRows.has(entry.id);
              const isIncome = entry.type === "income";
              const isPending = entry.status === "pending";
              const isReceived = entry.status === "received";
              const isPaid = entry.status === "paid";
              const showReceive =
                Boolean(isPending && isIncome && onReceive) &&
                (canReceiveEntry ? canReceiveEntry(entry) : true);
              const displayName = entry.patient?.name || entry.description;
              const patientId = entry.patientId ?? entry.patient?.id ?? null;
              const cpf = entry.patient?.cpf;
              const installmentLabel =
                entry.installmentNumber && entry.totalInstallments
                  ? `${entry.installmentNumber}/${entry.totalInstallments}`
                  : null;

              return (
                <TableRow
                  key={entry.id}
                  className={cn("align-middle", entry.isOverdue && "bg-red-50/50")}
                >
                  <TableCell className="align-middle">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) =>
                        handleSelectRow(entry.id, checked as boolean)
                      }
                      aria-label={`Selecionar ${entry.description}`}
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    {isIncome ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </TableCell>
                  <TableCell className="align-middle whitespace-nowrap">
                    {format(parseISO(entry.dueDate.substring(0, 10)), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className={cn(entry.isOverdue && "text-red-700 font-medium")}>
                          {displayName}
                        </span>
                        {patientId ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link
                                href={patientDetailDefaultHref(patientId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex shrink-0 text-primary transition-colors hover:text-primary/80"
                                aria-label="Abrir ficha do paciente em uma nova aba"
                              >
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Abrir ficha do paciente em uma nova aba
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                        {entry.hasReceipt && (
                          <span title="Possui comprovante">
                            <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                          </span>
                        )}
                        {installmentLabel && (
                          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {installmentLabel}
                          </span>
                        )}
                        {entry.category && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${entry.category.color}20`,
                              color: entry.category.color,
                            }}
                          >
                            {entry.category.name}
                          </span>
                        )}
                      </div>
                      {cpf && (
                        <span className="text-xs text-muted-foreground">{formatCPF(cpf)}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex min-w-[5.75rem] items-center justify-end">
                        <PaymentMethodBadge method={entry.paymentMethod} />
                      </div>
                      <span
                        className={cn(
                          "min-w-[5.5rem] text-right font-medium tabular-nums",
                          entry.isOverdue && !isReceived && !isPaid && "text-red-700",
                          (isReceived || isPaid) && "text-green-700",
                        )}
                      >
                        {formatCurrency(entry.value)}
                      </span>
                      <div className="flex h-8 w-[5.5rem] shrink-0 items-center justify-center">
                        {showReceive ? (
                          <Button
                            variant="ghost"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-500/10"
                            size="sm"
                            onClick={() => onReceive?.(entry)}
                          >
                            Receber
                          </Button>
                        ) : null}
                        {isPending && !isIncome && onPay ? (
                          <Button
                            variant="ghost"
                            className="text-orange-500 hover:text-orange-700 hover:bg-orange-500/10"
                            size="sm"
                            onClick={() => onPay(entry)}
                          >
                            Pagar
                          </Button>
                        ) : null}
                        {(isReceived || isPaid) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isPending ? (
                          <>
                            {showReceive && (
                              <DropdownMenuItem onClick={() => onReceive?.(entry)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Receber
                              </DropdownMenuItem>
                            )}
                            {!isIncome && onPay && (
                              <DropdownMenuItem onClick={() => onPay(entry)}>
                                <CreditCard className="mr-2 h-4 w-4" />
                                Pagar
                              </DropdownMenuItem>
                            )}
                            {(showReceive || (!isIncome && onPay)) && <DropdownMenuSeparator />}
                            {onEdit && (
                              <DropdownMenuItem onClick={() => onEdit(entry)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {onDelete && (
                              <DropdownMenuItem
                                onClick={() => onDelete(entry)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </>
                        ) : (
                          <>
                            {onViewPayment && (isReceived || isPaid) && (
                              <DropdownMenuItem onClick={() => onViewPayment(entry)}>
                                <Eye className="mr-2 h-4 w-4" />
                                {isIncome ? "Visualizar recebimento" : "Visualizar pagamento"}
                              </DropdownMenuItem>
                            )}
                            {onEmitReceipt && isIncome && isReceived && (
                              <DropdownMenuItem onClick={() => onEmitReceipt(entry)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Emitir recibo
                              </DropdownMenuItem>
                            )}
                            {onCancelPayment && (isReceived || isPaid) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onCancelPayment(entry)}
                                  className="text-destructive"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {isIncome ? "Cancelar recebimento" : "Cancelar pagamento"}
                                </DropdownMenuItem>
                              </>
                            )}
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

      {sortedEntries.length > 0 && (
        <div className="flex shrink-0 flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {sortedEntries.length} registro(s) no total
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <p className="whitespace-nowrap text-sm font-medium">
                <span className="xl:hidden">Por página</span>
                <span className="hidden xl:inline">Linhas por página</span>
              </p>
              <Select value={`${pageSize}`} onValueChange={handlePageSizeChange}>
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
              Página {currentPage} de {Math.max(totalPages, 1)}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
