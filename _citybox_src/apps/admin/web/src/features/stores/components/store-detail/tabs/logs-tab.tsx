"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Info, AlertTriangle, XCircle, Flame } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DateRangePickerInput, SearchInput } from "@citybox/ui/molecules";
import type { DateRange } from "@citybox/ui/molecules";
import { DataTable } from "@citybox/ui/organisms";
import { cn } from "@citybox/ui";
import type { AuditSeverity, StoreAuditEntry } from "../../../types";
import { useStoreAuditLogQuery } from "../../../hooks/use-store-audit-log-query";

interface LogsTabProps {
  storeId: string;
}

const severityConfig: Record<
  AuditSeverity,
  { label: string; icon: typeof Info; className: string }
> = {
  info: {
    label: "Info",
    icon: Info,
    className: "border-blue-200 bg-blue-50 text-blue-700",
  },
  aviso: {
    label: "Aviso",
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  erro: {
    label: "Erro",
    icon: XCircle,
    className: "border-red-200 bg-red-50 text-red-700",
  },
  critico: {
    label: "Crítico",
    icon: Flame,
    className: "border-red-300 bg-red-100 text-red-800 font-semibold",
  },
};

function getColumns(): ColumnDef<StoreAuditEntry>[] {
  return [
    {
      accessorKey: "occurredAt",
      header: "Data e Hora",
      sortingFn: "datetime",
      cell: ({ row }) => {
        const date = new Date(row.original.occurredAt);
        return (
          <div className="min-w-[110px]">
            <p className="text-sm font-medium tabular-nums">
              {date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {date.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "severity",
      header: "Severidade",
      cell: ({ row }) => {
        const cfg = severityConfig[row.original.severity];
        const Icon = cfg.icon;
        return (
          <Badge variant="outline" className={cn("text-xs gap-1.5 whitespace-nowrap", cfg.className)}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "actor",
      header: "Usuário",
      cell: ({ row }) => (
        <div className="min-w-[130px]">
          <p className="text-sm font-medium">{row.original.actor}</p>
          {row.original.actorRole && (
            <p className="text-xs text-muted-foreground">{row.original.actorRole}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "module",
      header: "Módulo",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs font-normal whitespace-nowrap">
          {row.original.module}
        </Badge>
      ),
    },
    {
      accessorKey: "action",
      header: "Ação",
      cell: ({ row }) => <span className="text-sm">{row.original.action}</span>,
    },
  ];
}

function todayRange(): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return { from: today, to: today };
}

function formatDateIso(date?: Date): string | undefined {
  if (!date) return undefined;
  return date.toISOString().split("T")[0];
}

export function LogsTab({ storeId }: LogsTabProps) {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<AuditSeverity | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(todayRange);
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      page,
      perPage: 10,
      search: search.trim() || undefined,
      severity: severity === "all" ? undefined : severity,
      dateFrom: formatDateIso(dateRange?.from),
      dateTo: formatDateIso(dateRange?.to),
    }),
    [page, search, severity, dateRange],
  );

  const { entries, meta, isPending } = useStoreAuditLogQuery(storeId, queryParams);

  const columns = getColumns();
  const hasActiveFilters = search !== "" || severity !== "all";

  return (
    <Card className="shadow-none">
      <CardHeader className="px-6 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por usuário ou ação..."
            className="w-72"
          />
          <Select
            value={severity}
            onValueChange={(v) => {
              setSeverity(v as AuditSeverity | "all");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as severidades</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="aviso">Aviso</SelectItem>
              <SelectItem value="erro">Erro</SelectItem>
              <SelectItem value="critico">Crítico</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePickerInput
            value={dateRange}
            onChange={(range) => {
              setDateRange(range);
              setPage(1);
            }}
            placeholder="Selecionar período"
            className="w-64"
            numberOfMonths={2}
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => {
                setSearch("");
                setSeverity("all");
                setPage(1);
              }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0 space-y-4">
        <DataTable
          columns={columns}
          data={entries}
          pageSize={entries.length || 10}
          entityName="registros"
          emptyMessage={
            isPending
              ? "Carregando logs..."
              : "Nenhum log encontrado para os filtros selecionados."
          }
        />
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {meta.page} de {meta.totalPages} ({meta.total} registros)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isPending}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages || isPending}
                onClick={() => setPage((current) => current + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
