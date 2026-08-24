"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import {
  Badge,
  Button,
  DateRangePicker,
  Select,
  Typography,
  type DateRange,
} from "@citybox/mui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  formatCurrencyBRL,
  formatIsoDateBR,
} from "@/features/bank-accounts/lib/bank-account-format";
import {
  BANK_TRANSACTION_KIND_LABELS,
  signedAmount,
  type BankTransaction,
  type BankTransactionKind,
} from "@/features/bank-accounts/types/bank-account";

const KIND_BADGE_COLOR = {
  initial_balance: "muted",
  credit: "success",
  debit: "error",
} as const;

function parseIsoDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type BankAccountTransactionsTableProps = {
  transactions: BankTransaction[];
  isLoading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  kind: BankTransactionKind | "";
  onKindChange: (kind: BankTransactionKind | "") => void;
  effectiveFrom?: string;
  effectiveTo?: string;
  onPeriodChange: (from?: string, to?: string) => void;
};

/**
 * Visão analítica: todas as entradas e saídas com usuário responsável (quando
 * disponível na origem), efetivação e descrição — filtrável por tipo e
 * período (FR-005).
 */
export function BankAccountTransactionsTable({
  transactions,
  isLoading,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  kind,
  onKindChange,
  effectiveFrom,
  effectiveTo,
  onPeriodChange,
}: BankAccountTransactionsTableProps) {
  const columns = useMemo<DataTableColumn<BankTransaction>[]>(
    () => [
      {
        id: "effectiveAt",
        header: "Efetivação",
        render: (transaction) => (
          <Typography
            variant="body2"
            noWrap
            sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
          >
            {formatIsoDateBR(transaction.effectiveAt)}
          </Typography>
        ),
      },
      {
        id: "description",
        header: "Descrição",
        render: (transaction) => (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
            <Badge
              label={BANK_TRANSACTION_KIND_LABELS[transaction.kind]}
              color={KIND_BADGE_COLOR[transaction.kind]}
              size="small"
              sx={{ flexShrink: 0 }}
            />
            <Typography variant="body2" noWrap>
              {transaction.description}
            </Typography>
          </Stack>
        ),
      },
      {
        id: "createdByName",
        header: "Usuário",
        render: (transaction) => (
          <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>
            {transaction.createdByName || "—"}
          </Typography>
        ),
      },
      {
        id: "value",
        header: "Valor",
        align: "right",
        render: (transaction) => {
          const value = signedAmount(transaction);
          return (
            <Typography
              variant="body2"
              noWrap
              sx={{
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: value < 0 ? "error.main" : "success.main",
              }}
            >
              {value < 0 ? "− " : "+ "}
              {formatCurrencyBRL(Math.abs(value))}
            </Typography>
          );
        },
      },
    ],
    [],
  );

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="ba-tx-kind-label">Tipo</InputLabel>
          <Select
            labelId="ba-tx-kind-label"
            label="Tipo"
            size="small"
            value={kind}
            onChange={(event) =>
              onKindChange(event.target.value as BankTransactionKind | "")
            }
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(BANK_TRANSACTION_KIND_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DateRangePicker
          size="small"
          value={{
            from: parseIsoDate(effectiveFrom),
            to: parseIsoDate(effectiveTo),
          } as DateRange}
          onChange={(range) =>
            onPeriodChange(
              range?.from ? toIsoDate(range.from) : undefined,
              range?.to ? toIsoDate(range.to) : undefined,
            )
          }
        />

        {kind || effectiveFrom || effectiveTo ? (
          <Button
            type="button"
            variant="text"
            onClick={() => {
              onKindChange("");
              onPeriodChange(undefined, undefined);
            }}
          >
            Limpar filtros
          </Button>
        ) : null}
      </Stack>

      <Paper
        variant="outlined"
        sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <DataTable
            columns={columns}
            rows={transactions}
            getRowId={(transaction) => transaction.id}
            isLoading={isLoading}
            emptyMessage="Nenhuma movimentação registrada nesta conta."
            pagination={{
              page,
              perPage: pageSize,
              total,
              onPageChange,
              onPerPageChange: onPageSizeChange,
            }}
          />
        </Box>
      </Paper>
    </Stack>
  );
}
