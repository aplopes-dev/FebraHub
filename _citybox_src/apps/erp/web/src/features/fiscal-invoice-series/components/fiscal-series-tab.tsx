"use client";

import { useState } from "react";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import BlockOutlined from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { Button, ConfirmationDialog, toast } from "@citybox/mui";
import { SemanticBadge } from "@/components/ui/status";
import { RowActionsMenu } from "@/components/ui/list-page";
import { useFiscalCompany } from "@/features/facilita-nfe/hooks/use-fiscal-company";

import { useFiscalSequences } from "../hooks/use-fiscal-sequences";
import { useSequenceMutations } from "../hooks/use-sequence-mutations";
import { DOCUMENT_TYPE_LABEL } from "../lib/labels";
import { SeriesFormDialog } from "./series-form-dialog";
import { EditNumberDialog } from "./edit-number-dialog";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import type {
  CreateFiscalSequencePayload,
  FiscalEnvironment,
  FiscalSequenceDto,
} from "../api/fiscal-sequence.dto";

function errorMessage(error: unknown): string {
  return businessErrorMessage(error, "Não foi possível concluir a operação. Tente novamente.");
}

/** Aba "Séries" da tela Fiscal (spec erp/011). */
export function FiscalSeriesTab() {
  // Ambiente do filtro. Padrão HOMOLOGATION — a plataforma opera em homologação
  // hoje; o toggle permite ver PRODUCTION (numeração independente por ambiente).
  const [environment, setEnvironment] =
    useState<FiscalEnvironment>("HOMOLOGATION");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<FiscalSequenceDto | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<FiscalSequenceDto | null>(null);

  const { companyId, isCompanyMissing, isLoading: companyLoading } =
    useFiscalCompany();
  const query = useFiscalSequences(companyId, environment);
  const { create, updateNumber, setActive, remove } =
    useSequenceMutations(companyId);

  async function handleCreate(payload: CreateFiscalSequencePayload) {
    try {
      await create.mutateAsync(payload);
      setCreateOpen(false);
      toast.success("Série criada.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleEditNumber(newNumber: number) {
    if (!editTarget) return;
    try {
      await updateNumber.mutateAsync({ sequenceId: editTarget.id, newNumber });
      setEditTarget(null);
      toast.success("Número atualizado.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function handleSetActive(
    seq: FiscalSequenceDto,
    active: boolean,
  ): Promise<boolean> {
    try {
      await setActive.mutateAsync({ sequenceId: seq.id, active });
      toast.success(active ? "Série reativada." : "Série desativada.");
      return true;
    } catch (error) {
      toast.error(errorMessage(error));
      return false;
    }
  }

  async function handleDelete(seq: FiscalSequenceDto) {
    try {
      await remove.mutateAsync(seq.id);
      toast.success("Série excluída.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  const sequences = query.data ?? [];

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          aria-label="Ambiente fiscal"
          value={environment}
          onChange={(_, next: FiscalEnvironment | null) =>
            next && setEnvironment(next)
          }
        >
          <ToggleButton value="HOMOLOGATION" sx={{ textTransform: "none" }}>
            Homologação
          </ToggleButton>
          <ToggleButton value="PRODUCTION" sx={{ textTransform: "none" }}>
            Produção
          </ToggleButton>
        </ToggleButtonGroup>

        <Button
          startIcon={<AddOutlined sx={{ fontSize: 18 }} />}
          onClick={() => setCreateOpen(true)}
          disabled={!companyId}
        >
          Adicionar série
        </Button>
      </Stack>

      {/* BUG-07 (2026-08-13): `isLoading` (`isPending && isFetching`) cai pra
          `false` entre tentativas de retry (fetch parado, ainda sem dado nem
          erro final) — o componente caía no ramo de lista vazia por um
          instante, mostrando "Nenhuma série cadastrada" quando na real a
          chamada só estava re-tentando. `isPending` (`status === 'pending'`)
          continua `true` durante toda a sequência de retry, só vira `false`
          quando a query assenta em sucesso ou erro final. */}
      {companyLoading || query.isPending ? (
        <Skeleton variant="rounded" height={160} />
      ) : isCompanyMissing ? (
        <Alert severity="info">
          O emitente fiscal ainda não está configurado. Envie o certificado
          digital na aba <strong>Certificado</strong> para habilitar as séries.
        </Alert>
      ) : query.isError ? (
        <Alert severity="error">
          Não foi possível carregar as séries. Tente novamente.
        </Alert>
      ) : sequences.length === 0 ? (
        <Box
          sx={{
            p: 4,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Nenhuma série cadastrada neste ambiente. A numeração também é criada
            automaticamente na primeira emissão — cadastrar aqui serve para
            controlar ou migrar a numeração.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Série</TableCell>
                <TableCell>Número atual</TableCell>
                <TableCell>Para venda de</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sequences.map((seq) => {
                const canDelete = seq.currentNumber === "0";
                return (
                  <TableRow key={seq.id}>
                    <TableCell>{seq.series}</TableCell>
                    <TableCell>{seq.currentNumber}</TableCell>
                    <TableCell>{DOCUMENT_TYPE_LABEL[seq.documentType]}</TableCell>
                    <TableCell>
                      {seq.active ? (
                        <SemanticBadge label="Ativa" tone="success" />
                      ) : (
                        <SemanticBadge label="Inativa" tone="neutral" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <RowActionsMenu
                        ariaLabel={`Ações da série ${seq.series}`}
                        items={[
                          {
                            id: "edit-number",
                            label: "Ajustar número",
                            icon: <EditOutlined sx={{ fontSize: 16 }} />,
                            onClick: () => setEditTarget(seq),
                          },
                          seq.active
                            ? {
                                id: "deactivate",
                                label: "Desativar",
                                icon: <BlockOutlined sx={{ fontSize: 16 }} />,
                                onClick: () => setDeactivateTarget(seq),
                              }
                            : {
                                id: "activate",
                                label: "Reativar",
                                icon: (
                                  <CheckCircleOutlined sx={{ fontSize: 16 }} />
                                ),
                                onClick: () => handleSetActive(seq, true),
                              },
                          {
                            id: "delete",
                            label: "Excluir",
                            icon: <DeleteOutlined sx={{ fontSize: 16 }} />,
                            destructive: true,
                            dividerBefore: true,
                            disabled: !canDelete,
                            disabledCaption:
                              "Série já usada não pode ser excluída — desative.",
                          },
                        ]}
                        confirmDelete={{
                          title: `Excluir a série ${seq.series}?`,
                          description:
                            "A série nunca foi usada e será removida definitivamente.",
                          confirmLabel: "Excluir",
                          onConfirm: () => handleDelete(seq),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {createOpen ? (
        <SeriesFormDialog
          open={createOpen}
          environment={environment}
          isSaving={create.isPending}
          errorMessage={create.isError ? errorMessage(create.error) : null}
          onClose={() => {
            create.reset();
            setCreateOpen(false);
          }}
          onSubmit={handleCreate}
        />
      ) : null}

      {editTarget ? (
        <EditNumberDialog
          key={editTarget.id}
          open={Boolean(editTarget)}
          seriesLabel={editTarget.series}
          currentNumber={editTarget.currentNumber}
          isSaving={updateNumber.isPending}
          errorMessage={
            updateNumber.isError ? errorMessage(updateNumber.error) : null
          }
          onClose={() => {
            updateNumber.reset();
            setEditTarget(null);
          }}
          onSubmit={handleEditNumber}
        />
      ) : null}

      <ConfirmationDialog
        open={Boolean(deactivateTarget)}
        loading={setActive.isPending}
        onCancel={() => setDeactivateTarget(null)}
        title="Desativar série?"
        description="Novas emissões nesta série serão bloqueadas até você reativá-la. A numeração já usada é preservada."
        confirmLabel="Desativar"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={async () => {
          if (!deactivateTarget) return;
          const ok = await handleSetActive(deactivateTarget, false);
          if (ok) setDeactivateTarget(null);
        }}
      />
    </Stack>
  );
}
