"use client";

import Link from "next/link";
import ReceiptLongOutlined from "@mui/icons-material/ReceiptLongOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Button, EmptyState, PageHeader } from "@citybox/mui";
import { BackButton } from "@/components/ui/form";
import { useIcmsGroupsQuery } from "../hooks/use-icms-groups";

const BASE_PATH = "/configuracoes/fiscal/grupos-icms";

function situacaoLabel(cst: string | null, csosn: string | null): string {
  if (cst) return `CST ${cst}`;
  if (csosn) return `CSOSN ${csosn}`;
  return "—";
}

/** Lista de Grupos de ICMS (spec erp/016) — rota própria sob o leaf fiscal. */
export function IcmsGroupListPage() {
  const groupsQuery = useIcmsGroupsQuery();

  const header = (
    <PageHeader
      title="Grupos de ICMS"
      description="Regras de tributação de ICMS reutilizáveis, aplicadas aos produtos."
      actions={
        <Button component={Link} href={`${BASE_PATH}/novo`}>
          Novo grupo ICMS
        </Button>
      }
    />
  );

  if (groupsQuery.isPending) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {header}
        <Skeleton variant="rounded" height={240} />
      </Box>
    );
  }

  if (groupsQuery.isError) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {header}
        <Alert severity="error">
          Não foi possível carregar os grupos de ICMS. Tente novamente.
        </Alert>
        <BackButton href="/configuracoes/fiscal" label="Voltar para Fiscal" />
      </Box>
    );
  }

  const groups = groupsQuery.data ?? [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {header}
      {groups.length === 0 ? (
        <EmptyState
          icon={<ReceiptLongOutlined sx={{ fontSize: 24 }} />}
          title="Nenhum grupo de ICMS encontrado"
          description="Crie um grupo de ICMS para organizar e aplicar regras fiscais aos seus produtos de forma prática."
          action={
            <Button component={Link} href={`${BASE_PATH}/novo`}>
              Novo grupo ICMS
            </Button>
          }
        />
      ) : (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Situação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id} hover sx={{ position: "relative" }}>
                  <TableCell sx={{ fontWeight: 500 }}>
                    <Link
                      href={`${BASE_PATH}/${group.id}`}
                      aria-label={`${group.name} — ${situacaoLabel(group.icmsCst, group.icmsCsosn)}`}
                      style={{ position: "absolute", inset: 0, zIndex: 1 }}
                    />
                    {group.name}
                  </TableCell>
                  <TableCell>
                    {situacaoLabel(group.icmsCst, group.icmsCsosn)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
