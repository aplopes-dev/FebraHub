"use client";

import Link from "next/link";
import FactoryOutlined from "@mui/icons-material/FactoryOutlined";
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
import { useIpiGroupsQuery } from "../hooks/use-ipi-groups";
import { IPI_CST_LABEL } from "../lib/ipi-options";

const BASE_PATH = "/configuracoes/fiscal/grupos-ipi";

/** Lista de Grupos do IPI (spec erp/019) — rota própria sob o leaf fiscal. */
export function IpiGroupListPage() {
  const groupsQuery = useIpiGroupsQuery();

  const header = (
    <PageHeader
      title="Grupos IPI"
      description="Regras de tributação de IPI (CST, enquadramento legal e percentual) reutilizadas na emissão."
      actions={
        <Button component={Link} href={`${BASE_PATH}/novo`}>
          Novo Grupo IPI
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
          Não foi possível carregar os grupos de IPI. Tente novamente.
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
          icon={<FactoryOutlined sx={{ fontSize: 24 }} />}
          title="Nenhum grupo de IPI encontrado"
          description="Crie um grupo de IPI para organizar e aplicar regras fiscais aos seus produtos de forma prática."
          action={
            <Button component={Link} href={`${BASE_PATH}/novo`}>
              Novo Grupo IPI
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
                <TableCell>Enquadramento (cEnq)</TableCell>
                <TableCell>Percentual</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id} hover sx={{ position: "relative" }}>
                  {/* Stretched-link: mantém <tr>/<td> válidos e a linha clicável. */}
                  <TableCell sx={{ fontWeight: 500 }}>
                    <Link
                      href={`${BASE_PATH}/${group.id}`}
                      aria-label={group.name}
                      style={{ position: "absolute", inset: 0, zIndex: 1 }}
                    />
                    {group.name}
                  </TableCell>
                  <TableCell>
                    {group.ipiCst
                      ? (IPI_CST_LABEL[group.ipiCst] ?? group.ipiCst)
                      : "—"}
                  </TableCell>
                  <TableCell>{group.ipiEnquadramento ?? "—"}</TableCell>
                  <TableCell>
                    {group.ipiRate == null ? "—" : `${group.ipiRate}%`}
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
