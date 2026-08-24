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
import { usePisCofinsGroupsQuery } from "../hooks/use-pis-cofins-groups";

const BASE_PATH = "/configuracoes/fiscal/grupos-pis-cofins";

function cstLabel(cst: string | null, aliquota: number | null): string {
  if (!cst) return "—";
  return aliquota != null ? `${cst} · ${aliquota}%` : cst;
}

/** Lista de Grupos de PIS/COFINS (spec erp/015) — rota própria sob o leaf fiscal. */
export function PisCofinsGroupListPage() {
  const groupsQuery = usePisCofinsGroupsQuery();

  const header = (
    <PageHeader
      title="Grupos de PIS/COFINS"
      description="Regras de tributação de PIS/COFINS reutilizáveis, aplicadas aos produtos."
      actions={
        <Button component={Link} href={`${BASE_PATH}/novo`}>
          Novo Grupo PIS/COFINS
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
          Não foi possível carregar os grupos de PIS/COFINS. Tente novamente.
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
          title="Nenhum grupo de PIS/COFINS encontrado"
          description="Crie um grupo de PIS/COFINS para organizar e aplicar regras fiscais aos seus produtos de forma prática."
          action={
            <Button component={Link} href={`${BASE_PATH}/novo`}>
              Novo Grupo PIS/COFINS
            </Button>
          }
        />
      ) : (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>PIS</TableCell>
                <TableCell>COFINS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id} hover sx={{ position: "relative" }}>
                  {/* Stretched-link: mantém <tr>/<td> válidos (um <a> dentro de
                      <tbody> quebra a hidratação) e ainda deixa a linha clicável. */}
                  <TableCell sx={{ fontWeight: 500 }}>
                    <Link
                      href={`${BASE_PATH}/${group.id}`}
                      aria-label={group.name}
                      style={{ position: "absolute", inset: 0, zIndex: 1 }}
                    />
                    {group.name}
                  </TableCell>
                  <TableCell>{cstLabel(group.pisCst, group.pisAliquota)}</TableCell>
                  <TableCell>
                    {cstLabel(group.cofinsCst, group.cofinsAliquota)}
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
