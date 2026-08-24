"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import { PageHeader } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { PosCashSessionFiltersBar } from "@/features/pos-cash-sessions/components/pos-cash-session-filters-bar";
import { PosCashSessionListTable } from "@/features/pos-cash-sessions/components/pos-cash-session-list-table";
import { PosCashSessionSalesDrawer } from "@/features/pos-cash-sessions/components/pos-cash-session-sales-drawer";
import { usePosCashSessionList } from "@/features/pos-cash-sessions/hooks/use-pos-cash-session-list";
import type { PosCashSession } from "@/features/pos-cash-sessions/types/pos-cash-session";

export function PosCashSessionListPage() {
  const {
    draftFilters,
    setDraftFilters,
    applyFilters,
    clearFilters,
    page,
    setPage,
    perPage,
    setPerPage,
    result,
  } = usePosCashSessionList();

  const [selectedSession, setSelectedSession] = useState<PosCashSession | null>(
    null,
  );

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Gerenciar caixas"
      />

      <ListPagePanel>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            gap: 2,
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <PosCashSessionFiltersBar
              filters={draftFilters}
              onChange={setDraftFilters}
              onClear={clearFilters}
              onApply={applyFilters}
            />
          </Box>

          <PosCashSessionListTable
            sessions={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            onOpenSales={setSelectedSession}
          />
        </Box>
      </ListPagePanel>

      <PosCashSessionSalesDrawer
        session={selectedSession}
        onOpenChange={(open) => {
          if (!open) setSelectedSession(null);
        }}
      />
    </ListPageShell>
  );
}
