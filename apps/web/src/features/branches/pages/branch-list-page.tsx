"use client";

import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, PageHeader, SearchInput } from "@/ui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { OrganizationUnitsAccordion } from "@/features/branches/components/organization-units-accordion";
import { useOrganizationUnitsList } from "@/features/branches/hooks/use-organization-units-list";

export function BranchListPage() {
  const {
    search,
    setSearch,
    structure,
    matrixCount,
    storeCount,
    isSearchActive,
    isFetching,
    isError,
    error,
    refresh,
    onDeleteMatrix,
    onDeleteStore,
  } = useOrganizationUnitsList();

  const hasMatrices = matrixCount > 0;

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Matrizes e Filiais"
        description="Cada matriz representa uma empresa do grupo; as filiais são as unidades operacionais vinculadas a ela."
        actions={
          hasMatrices ? (
            <Button
              component={Link}
              href="/settings/units/matrices/new"
              variant="outlined"
              startIcon={<AddIcon />}
            >
              Nova matriz
            </Button>
          ) : undefined
        }
      />

      <ListPagePanel>
        {hasMatrices ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <BusinessOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                {matrixCount} {matrixCount === 1 ? "matriz" : "matrizes"} ·{" "}
                {storeCount} {storeCount === 1 ? "filial" : "filiais"}
              </Typography>
            </Stack>
            <SearchInput
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar matriz ou filial…"
              sx={{ width: { xs: "100%", sm: 320 } }}
            />
          </Stack>
        ) : null}

        {isError ? (
          <ListLoadErrorAlert
            title="Não foi possível carregar as matrizes"
            message={error instanceof Error ? error.message : "Erro inesperado"}
            onRetry={refresh}
          />
        ) : (
          <Box sx={{ mt: hasMatrices ? 2 : 0 }}>
            <OrganizationUnitsAccordion
              structure={structure}
              isFetching={isFetching}
              isSearchActive={isSearchActive}
              onDeleteMatrix={onDeleteMatrix}
              onDeleteStore={onDeleteStore}
            />
          </Box>
        )}
      </ListPagePanel>
    </ListPageShell>
  );
}
