"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Category from "@mui/icons-material/CategoryOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Button, EmptyState, PageHeader, Tab, Tabs } from "@citybox/mui";
import { RowActionsMenu } from "@/components/ui/list-page";
import { FiscalScrollablePage } from "@/components/ui/form";
import {
  TAB_BY_TAX_TYPE,
  TAX_TYPE_BY_TAB,
  type FiscalGroupTab,
} from "../api/fiscal-groups.dto";
import {
  useDeleteFiscalGroupMutation,
  useFiscalGroupsRichQuery,
} from "../hooks/use-fiscal-groups";
import {
  TRIBUTO_NEW_LABEL,
  TRIBUTO_ROUTE,
  TRIBUTO_TAB_LABEL,
  rateLabel,
  taxSituationLabel,
} from "../lib/tributo-options";

const BASE_PATH = "/configuracoes/fiscal/grupos";
const TABS: FiscalGroupTab[] = ["icms", "ipi", "pis_cofins", "issqn"];

function isFiscalGroupTab(value: string): value is FiscalGroupTab {
  return (TABS as string[]).includes(value);
}

/**
 * Grupos fiscais unificados (spec erp/022, D1) — substitui as 4 telas
 * separadas (`/grupos-icms`, `/grupos-ipi`, `/grupos-pis-cofins`,
 * `/grupos-issqn`, agora `redirect()` pra cá). Abas por tributo na URL
 * (`?tributo=`, molde `fiscal-additional-info`); "Novo grupo" e "Editar"
 * continuam nos formulários já implementados por tributo — esta tela só
 * resolve a casca de lista/navegação/exclusão.
 */
export function FiscalGroupsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get("tributo");
  const activeTab: FiscalGroupTab =
    rawTab && isFiscalGroupTab(rawTab) ? rawTab : "icms";
  const taxType = TAX_TYPE_BY_TAB[activeTab];

  const groupsQuery = useFiscalGroupsRichQuery(taxType);
  const deleteMutation = useDeleteFiscalGroupMutation(taxType);

  function handleTabChange(next: FiscalGroupTab) {
    if (next === activeTab) return;
    const params = new URLSearchParams(searchParams);
    params.set("tributo", next);
    router.replace(`${BASE_PATH}?${params.toString()}`);
  }

  const groups = groupsQuery.data ?? [];
  const newHref = `${TRIBUTO_ROUTE[activeTab]}/novo`;

  return (
    <FiscalScrollablePage>
      <PageHeader
        title="Grupos fiscais"
        description="Regras de tributação reutilizáveis (ICMS, IPI, PIS/COFINS, ISSQN), aplicadas aos produtos e serviços."
        actions={
          <Button component={Link} href={newHref}>
            {TRIBUTO_NEW_LABEL[activeTab]}
          </Button>
        }
      />

      <Tabs
        value={activeTab}
        aria-label="Tributo"
        onChange={(_, next: FiscalGroupTab) => handleTabChange(next)}
        sx={{
          minHeight: 44,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTabs-indicator": { height: 2 },
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab}
            value={tab}
            label={TRIBUTO_TAB_LABEL[tab]}
            id={`grupos-fiscais-tab-${tab}`}
            aria-controls={`grupos-fiscais-tabpanel-${tab}`}
            sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
          />
        ))}
      </Tabs>

      <Box
        role="tabpanel"
        id={`grupos-fiscais-tabpanel-${activeTab}`}
        aria-labelledby={`grupos-fiscais-tab-${activeTab}`}
        sx={{ pt: 2 }}
      >
        {groupsQuery.isPending ? (
          <Skeleton variant="rounded" height={240} />
        ) : groupsQuery.isError ? (
          <Alert severity="error">
            Não foi possível carregar os grupos de{" "}
            {TRIBUTO_TAB_LABEL[activeTab]}. Tente novamente.
          </Alert>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Category sx={{ fontSize: 24 }} />}
            title={`Nenhum grupo de ${TRIBUTO_TAB_LABEL[activeTab]} encontrado`}
            description="Crie um grupo para organizar e aplicar regras fiscais aos seus produtos ou serviços de forma prática."
            action={
              <Button component={Link} href={newHref}>
                {TRIBUTO_NEW_LABEL[activeTab]}
              </Button>
            }
          />
        ) : (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Situação tributária</TableCell>
                  <TableCell>Alíquota</TableCell>
                  <TableCell align="right">Produtos</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Link
                        href={`${TRIBUTO_ROUTE[TAB_BY_TAX_TYPE[group.taxType]]}/${group.id}`}
                      >
                        {group.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {taxSituationLabel(group.taxType, group.taxSituation)}
                    </TableCell>
                    <TableCell>{rateLabel(group.rate)}</TableCell>
                    <TableCell align="right">{group.productCount}</TableCell>
                    <TableCell align="right">
                      <RowActionsMenu
                        ariaLabel={`Ações de ${group.name}`}
                        items={[
                          {
                            id: "edit",
                            label: "Editar",
                            href: `${TRIBUTO_ROUTE[TAB_BY_TAX_TYPE[group.taxType]]}/${group.id}`,
                          },
                          { id: "delete", label: "Excluir" },
                        ]}
                        confirmDelete={{
                          title: "Excluir grupo fiscal",
                          description: `O grupo "${group.name}" será removido. Grupos em uso (vinculados a produtos ou definidos como padrão fiscal) não podem ser excluídos.`,
                          confirmLabel: "Excluir",
                          onConfirm: () => deleteMutation.mutateAsync(group.id),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Box>
    </FiscalScrollablePage>
  );
}
