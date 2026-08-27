"use client";

import EditOutlined from "@mui/icons-material/EditOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import UploadFileOutlined from "@mui/icons-material/UploadFileOutlined";
import { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { useParams } from "next/navigation";
import { toast } from "@/ui";
import { Button, EmptyState, Tab, Tabs, Typography } from "@/ui";
import { BackButton, EntityFormHeader } from "@/components/ui/form";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { BankAccountCreateDrawer } from "@/features/bank-accounts/components/bank-account-create-drawer";
import { BankAccountStatement } from "@/features/bank-accounts/components/bank-account-statement";
import { BankAccountTransactionsTable } from "@/features/bank-accounts/components/bank-account-transactions-table";
import { formatCurrencyBRL } from "@/features/bank-accounts/lib/bank-account-format";
import {
  useBankAccountQuery,
  useBankAccountStatementQuery,
  useBankAccountTransactionsQuery,
} from "@/features/bank-accounts/hooks/use-bank-account-queries";
import type { BankTransactionKind } from "@/features/bank-accounts/types/bank-account";

const LIST_PATH = "/financas/contas-bancarias";
const DEFAULT_PER_PAGE = 10;

type DetailView = "transacoes" | "historico";

type BankAccountDetailPageProps = {
  /** Visão inicial — o menu ⋯ da lista abre direto em Transações ou Histórico. */
  initialView?: DetailView;
};

export function BankAccountDetailPage({
  initialView = "transacoes",
}: BankAccountDetailPageProps) {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [view, setView] = useState<DetailView>(initialView);
  const [editOpen, setEditOpen] = useState(false);

  const accountQuery = useBankAccountQuery(id);

  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(DEFAULT_PER_PAGE);
  const [kind, setKind] = useState<BankTransactionKind | "">("");
  const [effectiveFrom, setEffectiveFrom] = useState<string | undefined>();
  const [effectiveTo, setEffectiveTo] = useState<string | undefined>();
  const transactionsQuery = useBankAccountTransactionsQuery(id, {
    kind: kind || undefined,
    effectiveFrom,
    effectiveTo,
    page: transactionsPage,
    perPage: transactionsPerPage,
  });

  const [statementPage, setStatementPage] = useState(1);
  const statementQuery = useBankAccountStatementQuery(id, {
    page: statementPage,
    perPage: DEFAULT_PER_PAGE,
  });

  if (accountQuery.isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Skeleton variant="text" width={240} height={40} />
        <Skeleton variant="rounded" height={100} />
        <Skeleton variant="rounded" height={320} />
      </Box>
    );
  }

  if (accountQuery.isError || !accountQuery.data) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          textAlign: "center",
        }}
      >
        <EmptyState
          icon={<InfoOutlined sx={{ fontSize: 24 }} />}
          title="Conta não encontrada"
          description="A conta bancária que você tentou abrir não existe mais ou foi removida."
          action={
            <BackButton
              href={LIST_PATH}
              label="Voltar para Contas bancárias"
            />
          }
        />
      </Box>
    );
  }

  const account = accountQuery.data;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        gap: 3,
        overflowY: "auto",
        pb: 3,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "flex-start" }, justifyContent: "space-between" }}
      >
        <EntityFormHeader
          title={account.name}
          subtitle={account.bankName}
          backHref={LIST_PATH}
        />
        <Stack direction="row" spacing={1}>
          <Button
            type="button"
            variant="outlined"
            startIcon={<EditOutlined sx={{ fontSize: 16 }} />}
            onClick={() => setEditOpen(true)}
          >
            Editar
          </Button>
          <Button
            type="button"
            variant="outlined"
            startIcon={<UploadFileOutlined sx={{ fontSize: 16 }} />}
            onClick={() =>
              toast.message(`Importação de extrato OFX para ${account.name} em breve`)
            }
          >
            Importar extrato (OFX)
          </Button>
        </Stack>
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          p: 2.5,
          bgcolor: "background.paper",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: "text.secondary",
          }}
        >
          Saldo atual
        </Typography>
        <Typography
          variant="h4"
          sx={{
            mt: 0.5,
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.02em",
            color: account.currentBalance < 0 ? "error.main" : "text.primary",
          }}
        >
          {formatCurrencyBRL(account.currentBalance)}
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Tabs
          value={view}
          onChange={(_, next: DetailView) => setView(next)}
          sx={{
            minHeight: 48,
            borderBottom: 1,
            borderColor: "divider",
            width: "fit-content",
            "& .MuiTabs-indicator": { height: 2 },
          }}
        >
          <Tab
            value="transacoes"
            label="Transações"
            sx={{
              minHeight: 48,
              px: 1.5,
              py: 1.5,
              textTransform: "none",
              fontWeight: 500,
              color: "text.secondary",
              "&.Mui-selected": { color: "primary.main" },
            }}
          />
          <Tab
            value="historico"
            label="Histórico"
            sx={{
              minHeight: 48,
              px: 1.5,
              py: 1.5,
              textTransform: "none",
              fontWeight: 500,
              color: "text.secondary",
              "&.Mui-selected": { color: "primary.main" },
            }}
          />
        </Tabs>

        {view === "transacoes" ? (
          transactionsQuery.isError ? (
            <ListLoadErrorAlert
              title="Não foi possível carregar as transações"
              onRetry={() => void transactionsQuery.refetch()}
            />
          ) : (
            <BankAccountTransactionsTable
              transactions={transactionsQuery.data?.data ?? []}
              isLoading={transactionsQuery.isLoading}
              page={transactionsPage}
              total={transactionsQuery.data?.meta.total ?? 0}
              pageSize={transactionsPerPage}
              onPageChange={setTransactionsPage}
              onPageSizeChange={(next) => {
                setTransactionsPerPage(next);
                setTransactionsPage(1);
              }}
              kind={kind}
              onKindChange={(next) => {
                setKind(next);
                setTransactionsPage(1);
              }}
              effectiveFrom={effectiveFrom}
              effectiveTo={effectiveTo}
              onPeriodChange={(from, to) => {
                setEffectiveFrom(from);
                setEffectiveTo(to);
                setTransactionsPage(1);
              }}
            />
          )
        ) : statementQuery.isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar o histórico"
            onRetry={() => void statementQuery.refetch()}
          />
        ) : (
          <BankAccountStatement
            entries={statementQuery.data?.data ?? []}
            isLoading={statementQuery.isLoading}
            page={statementPage}
            total={statementQuery.data?.meta.total ?? 0}
            pageSize={DEFAULT_PER_PAGE}
            onPageChange={setStatementPage}
          />
        )}
      </Box>

      <BankAccountCreateDrawer
        open={editOpen}
        onOpenChange={setEditOpen}
        account={account}
        onSaved={() => void accountQuery.refetch()}
      />
    </Box>
  );
}
