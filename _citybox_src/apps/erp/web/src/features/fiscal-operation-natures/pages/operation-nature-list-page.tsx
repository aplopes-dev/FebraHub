"use client";

import Link from "next/link";
import CompareArrowsOutlined from "@mui/icons-material/CompareArrowsOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Button, EmptyState, PageHeader } from "@citybox/mui";
import { BackButton, FiscalScrollablePage } from "@/components/ui/form";
import { RowActionsMenu } from "@/components/ui/list-page";
import {
  useDeleteOperationNatureMutation,
  useOperationNaturesQuery,
} from "../hooks/use-operation-natures";

const BASE_PATH = "/configuracoes/fiscal/naturezas-operacao";

/** Lista de Naturezas de Operação (spec erp/020) — rota própria sob o leaf fiscal. */
export function OperationNatureListPage() {
  const naturesQuery = useOperationNaturesQuery();
  const deleteMutation = useDeleteOperationNatureMutation();

  const header = (
    <PageHeader
      title="Naturezas de Operação"
      description="Regras de-para que, dada uma operação de entrada, determinam o CFOP e os grupos fiscais da saída correspondente (ex.: devolução de mercadoria para fornecedor)."
      actions={
        <Button component={Link} href={`${BASE_PATH}/novo`}>
          Nova natureza de operações
        </Button>
      }
    />
  );

  if (naturesQuery.isPending) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {header}
          <Skeleton variant="rounded" height={240} />
        </Box>
      </FiscalScrollablePage>
    );
  }

  if (naturesQuery.isError) {
    return (
      <FiscalScrollablePage>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {header}
          <Alert severity="error">
            Não foi possível carregar as naturezas de operação. Tente novamente.
          </Alert>
          <BackButton href="/configuracoes/fiscal" label="Voltar para Fiscal" />
        </Box>
      </FiscalScrollablePage>
    );
  }

  const natures = naturesQuery.data ?? [];

  return (
    <FiscalScrollablePage>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {header}
        {natures.length === 0 ? (
          <EmptyState
            icon={<CompareArrowsOutlined sx={{ fontSize: 24 }} />}
            title="Nenhuma natureza de operação encontrada"
            description="Crie uma natureza de operação para mapear o CFOP e os grupos fiscais de saída a partir de uma entrada (ex.: devolução para fornecedor)."
            action={
              <Button component={Link} href={`${BASE_PATH}/novo`}>
                Nova natureza de operações
              </Button>
            }
          />
        ) : (
          <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Regras de CFOP</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {natures.map((nature) => (
                  <TableRow key={nature.id} hover>
                    {/* Link no texto, não stretched-link: a linha também tem o
                        menu de ações, que precisa do próprio clique livre. */}
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Link href={`${BASE_PATH}/${nature.id}`}>{nature.name}</Link>
                    </TableCell>
                    <TableCell>{nature.description ?? "—"}</TableCell>
                    <TableCell>{nature.cfopRuleCount}</TableCell>
                    <TableCell align="right">
                      <RowActionsMenu
                        ariaLabel={`Ações de ${nature.name}`}
                        items={[
                          {
                            id: "edit",
                            label: "Editar",
                            href: `${BASE_PATH}/${nature.id}`,
                          },
                          { id: "delete", label: "Excluir" },
                        ]}
                        confirmDelete={{
                          title: "Excluir natureza de operação",
                          description: `A natureza "${nature.name}" será removida. Emissões futuras que dependeriam dela para resolver CFOP e grupos fiscais vão parar de encontrá-la — cadastre outra natureza antes, se ainda precisar dessa regra.`,
                          confirmLabel: "Excluir",
                          onConfirm: () => deleteMutation.mutateAsync(nature.id),
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
