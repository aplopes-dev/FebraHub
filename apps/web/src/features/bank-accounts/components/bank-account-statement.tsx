"use client";

import NorthEastOutlined from "@mui/icons-material/NorthEastOutlined";
import SouthWestOutlined from "@mui/icons-material/SouthWestOutlined";
import AccountBalanceOutlined from "@mui/icons-material/AccountBalanceOutlined";
import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Typography } from "@/ui";
import {
  formatCurrencyBRL,
  formatIsoDateBR,
} from "@/features/bank-accounts/lib/bank-account-format";
import {
  signedAmount,
  type BankStatementEntry,
  type BankTransaction,
} from "@/features/bank-accounts/types/bank-account";

type BankAccountStatementProps = {
  entries: BankStatementEntry[];
  isLoading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function entryIcon(transaction: BankTransaction) {
  if (transaction.kind === "debit") {
    return (
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          bgcolor: "error.main",
          color: "error.contrastText",
          opacity: 0.12,
          "& .entry-icon-inner": {
            opacity: 1,
            color: "error.main",
          },
        }}
      >
        <Box className="entry-icon-inner" sx={{ display: "flex" }}>
          <NorthEastOutlined sx={{ fontSize: 16 }} />
        </Box>
      </Box>
    );
  }
  if (transaction.kind === "credit") {
    return (
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          bgcolor: "success.main",
          color: "success.contrastText",
          opacity: 0.12,
          "& .entry-icon-inner": {
            opacity: 1,
            color: "success.main",
          },
        }}
      >
        <Box className="entry-icon-inner" sx={{ display: "flex" }}>
          <SouthWestOutlined sx={{ fontSize: 16 }} />
        </Box>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        bgcolor: "action.hover",
        color: "text.secondary",
      }}
    >
      <AccountBalanceOutlined sx={{ fontSize: 16 }} />
    </Box>
  );
}

/**
 * Extrato bancário: movimentações mais recentes primeiro, com saldo
 * acumulado após cada uma (FR-006/FR-007) — o cálculo já vem correto da API
 * mesmo entre páginas, esta view só exibe.
 */
export function BankAccountStatement({
  entries,
  isLoading,
  page,
  total,
  pageSize,
  onPageChange,
}: BankAccountStatementProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (!isLoading && entries.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          p: 5,
          textAlign: "center",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Nenhuma movimentação registrada nesta conta.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      <Paper
        variant="outlined"
        component="ol"
        sx={{
          borderRadius: 2,
          listStyle: "none",
          m: 0,
          p: 0,
          bgcolor: "background.paper",
          overflow: "hidden",
        }}
      >
        {entries.map((entry, index) => {
          const { transaction, runningBalance } = entry;
          const value = signedAmount(transaction);
          const previous = index > 0 ? entries[index - 1] : undefined;
          const showDateHeader =
            transaction.effectiveAt !== previous?.transaction.effectiveAt;

          return (
            <Box component="li" key={transaction.id}>
              {showDateHeader ? (
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    px: 2.5,
                    py: 1,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "text.secondary",
                    bgcolor: "action.hover",
                    borderBottom: 1,
                    borderColor: "divider",
                    ...(index > 0 ? { borderTop: 1, borderTopColor: "divider" } : {}),
                  }}
                >
                  {formatIsoDateBR(transaction.effectiveAt)}
                </Typography>
              ) : null}

              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "center",
                  px: 2.5,
                  py: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                  "&:last-child": { borderBottom: 0 },
                }}
              >
                {entryIcon(transaction)}

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
                    {transaction.description}
                  </Typography>
                  {transaction.createdByName ? (
                    <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                      Lançado por {transaction.createdByName}
                    </Typography>
                  ) : null}
                </Box>

                <Box sx={{ flexShrink: 0, textAlign: "right" }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                      color: value < 0 ? "error.main" : "success.main",
                    }}
                  >
                    {value < 0 ? "− " : "+ "}
                    {formatCurrencyBRL(Math.abs(value))}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontVariantNumeric: "tabular-nums", color: "text.secondary" }}
                  >
                    Saldo: {formatCurrencyBRL(runningBalance)}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Paper>

      {totalPages > 1 ? (
        <Stack direction="row" sx={{ justifyContent: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, next) => onPageChange(next)}
          />
        </Stack>
      ) : null}
    </Stack>
  );
}
