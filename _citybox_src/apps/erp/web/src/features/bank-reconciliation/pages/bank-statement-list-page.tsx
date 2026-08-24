"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { StatementImportDialog } from "@/features/bank-reconciliation/components/statement-import-dialog";
import { StatementListTable } from "@/features/bank-reconciliation/components/statement-list-table";
import { useBankStatementList } from "@/features/bank-reconciliation/hooks/use-bank-statement-list";

export function BankStatementListPage() {
  const {
    bankAccountId,
    setBankAccountId,
    setPage,
    setPerPage,
    result,
    isError,
    refresh,
  } = useBankStatementList();
  const { data: bankAccountOptions = [] } = useBankAccountOptionsQuery();
  const searchParams = useSearchParams();
  const deepLinkedBankAccountId = searchParams.get("bankAccountId") ?? undefined;
  const [importOpen, setImportOpen] = useState(() => Boolean(deepLinkedBankAccountId));

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Conciliação bancária"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setImportOpen(true)}>
            Importar extrato
          </Button>
        }
      />
      <ListPagePanel>
        <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
          <Box
            component="select"
            value={bankAccountId ?? ""}
            onChange={(event) => setBankAccountId(event.target.value || undefined)}
            sx={{
              height: 36,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              px: 1.5,
              bgcolor: "background.paper",
            }}
          >
            <option value="">Todas as contas</option>
            {bankAccountOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Box>
        </Stack>
        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os extratos"
            message="Tente novamente."
            onRetry={refresh}
          />
        ) : (
          <StatementListTable
            statements={result.data}
            page={result.meta.page}
            pageSize={result.meta.perPage}
            total={result.meta.total}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
          />
        )}
      </ListPagePanel>
      <StatementImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        initialBankAccountId={deepLinkedBankAccountId}
      />
    </ListPageShell>
  );
}
