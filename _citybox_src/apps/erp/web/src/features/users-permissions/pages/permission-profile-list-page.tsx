"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { Button, SearchInput } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { EntityFormHeader } from "@/components/ui/form";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { PermissionProfileListTable } from "@/features/users-permissions/components/permission-profile-list/permission-profile-list-table";
import { PermissionProfileListTabs } from "@/features/users-permissions/components/permission-profile-list/permission-profile-list-tabs";
import { usePermissionProfileList } from "@/features/users-permissions/hooks/use-permission-profile-list";
import {
  useDeletePermissionProfileMutation,
  useRestorePermissionProfileMutation,
} from "@/features/users-permissions/hooks/use-permission-profile-mutations";
import type { PermissionProfile } from "@/features/users-permissions/types/permission-profile";

export function PermissionProfileListPage() {
  const {
    tab,
    setTab,
    search,
    setSearch,
    result,
    isFetching,
    isError,
    error,
    refresh,
  } = usePermissionProfileList();

  const deleteMutation = useDeletePermissionProfileMutation();
  const restoreMutation = useRestorePermissionProfileMutation();

  async function handleDelete(profile: PermissionProfile) {
    await deleteMutation.mutateAsync(profile.id);
  }

  async function handleRestore(profile: PermissionProfile) {
    await restoreMutation.mutateAsync(profile.id);
  }

  return (
    <ListPageShell>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <EntityFormHeader
          title="Perfis de Acesso"
          subtitle="Usuários e permissões"
          backHref="/configuracoes/usuarios-permissoes"
        />
        <Button
          component={Link}
          href="/configuracoes/usuarios-permissoes/perfis/novo"
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
        >
          Novo perfil
        </Button>
      </Box>

      <ListPagePanel>
        <Box sx={{ flexShrink: 0 }}>
          <PermissionProfileListTabs
            value={tab}
            onValueChange={setTab}
            counts={result.tabCounts}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar perfil…"
            sx={{ width: { xs: "100%", sm: 320 } }}
          />
        </Box>

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar os perfis"
            message={
              error instanceof Error ? error.message : "Erro inesperado"
            }
            onRetry={() => void refresh()}
          />
        ) : (
          <PermissionProfileListTable
            profiles={result.data}
            isFetching={isFetching}
            onDelete={handleDelete}
            onRestore={handleRestore}
          />
        )}
      </ListPagePanel>
    </ListPageShell>
  );
}
