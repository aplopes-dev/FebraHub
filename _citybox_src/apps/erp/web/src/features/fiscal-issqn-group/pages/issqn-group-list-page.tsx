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
import { useIssqnGroupsQuery } from "../hooks/use-issqn-groups";
import { ISSQN_TRIB_TYPE_LABEL } from "../lib/issqn-options";

const BASE_PATH = "/configuracoes/fiscal/grupos-issqn";

/** Lista de Grupos de ISSQN (spec erp/018) — rota própria sob o leaf fiscal. */
export function IssqnGroupListPage() {
  const groupsQuery = useIssqnGroupsQuery();

  const header = (
    <PageHeader
      title="Grupos de ISSQN"
      description="Perfis fiscais de serviço (código, alíquota e exigibilidade) reutilizados na NFS-e."
      actions={
        <Button component={Link} href={`${BASE_PATH}/novo`}>
          Novo Grupo do ISSQN
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
          Não foi possível carregar os grupos de ISSQN. Tente novamente.
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
          title="Nenhum grupo de ISSQN encontrado"
          description="Crie um grupo de ISSQN para reutilizar código, alíquota e exigibilidade do serviço na emissão da NFS-e."
          action={
            <Button component={Link} href={`${BASE_PATH}/novo`}>
              Novo Grupo do ISSQN
            </Button>
          }
        />
      ) : (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Código municipal</TableCell>
                <TableCell>cTribNac</TableCell>
                <TableCell>Exigibilidade</TableCell>
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
                  <TableCell>{group.issqnServiceCode ?? "—"}</TableCell>
                  <TableCell>{group.issqnNationalCode ?? "—"}</TableCell>
                  <TableCell>
                    {group.issqnTribType
                      ? (ISSQN_TRIB_TYPE_LABEL[group.issqnTribType] ??
                        group.issqnTribType)
                      : "—"}
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
