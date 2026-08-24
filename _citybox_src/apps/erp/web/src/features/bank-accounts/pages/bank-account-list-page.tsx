"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, SearchInput } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { BankAccountCreateDrawer } from "@/features/bank-accounts/components/bank-account-create-drawer";
import { BankAccountListTable } from "@/features/bank-accounts/components/bank-account-list-table";
import { useBankAccountList } from "@/features/bank-accounts/hooks/use-bank-account-list";

export function BankAccountListPage() {
  const { search, setSearch, perPage, setPerPage, setPage, result, invalidate } =
    useBankAccountList();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
        gap: 2,
      }}
    >
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Contas bancárias"
        actions={
          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => setCreateOpen(true)}
          >
            Nova conta
          </Button>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0, mb: 2 }}>
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar conta ou banco…"
          />
        </Box>
        <BankAccountListTable
          accounts={result.data}
          page={result.meta.page}
          total={result.meta.total}
          pageSize={perPage}
          onPageChange={setPage}
          onPageSizeChange={setPerPage}
        />
      </ListPagePanel>

      <BankAccountCreateDrawer
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={invalidate}
      />
    </Box>
  );
}
