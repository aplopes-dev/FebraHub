"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import { Button, PageHeader } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { PromotionListTable } from "@/features/promotions/components/promotion-list-table";
import { PromotionListTabs } from "@/features/promotions/components/promotion-list-tabs";
import { PromotionListToolbar } from "@/features/promotions/components/promotion-list-toolbar";
import { usePromotionList } from "@/features/promotions/hooks/use-promotion-list";
import { usePromotionMutations } from "@/features/promotions/hooks/use-promotion-queries";
import type { Promotion } from "@/features/promotions/types/promotion";

export function PromotionListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    setPage,
    perPage,
    setPerPage,
    result,
  } = usePromotionList();

  const router = useRouter();
  const mutations = usePromotionMutations();

  function handleEdit(promotion: Promotion) {
    router.push(`/vendas/promocoes/${promotion.id}`);
  }

  function handleDelete(promotion: Promotion) {
    mutations.remove.mutate(promotion.id);
  }

  function handleRestore(promotion: Promotion) {
    mutations.restore.mutate(promotion.id);
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Promoções"
        actions={
          <Button
            type="button"
            variant="contained"
            component={Link}
            href="/vendas/promocoes/novo"
            startIcon={<AddIcon fontSize="small" />}
          >
            Nova promoção
          </Button>
        }
      />
      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <PromotionListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>
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
            <PromotionListToolbar
              search={search}
              onSearchChange={setSearch}
            />
          </Box>

          <PromotionListTable
            promotions={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRestore={handleRestore}
          />
        </Box>
      </ListPagePanel>
    </ListPageShell>
  );
}
