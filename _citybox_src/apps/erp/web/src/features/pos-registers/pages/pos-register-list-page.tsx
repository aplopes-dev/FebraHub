"use client";

import { useState } from "react";
import { useSaveModulesForTerminal } from "@/features/pos-modules/hooks/use-pos-modules";
import AddIcon from "@mui/icons-material/Add";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  PageHeader,
  SearchInput,
  Typography,
  toast,
} from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { useOrganization } from "@/lib/organization-context";
import {
  findPosOptionIdByLabel,
  POS_PRINTER_OPTIONS,
  POS_SCALE_OPTIONS,
} from "@/features/pos-registers/data/pos-register-options";
import { PosRegisterFormDialog } from "@/features/pos-registers/components/pos-register-form-dialog";
import { PosRegisterListTable } from "@/features/pos-registers/components/pos-register-list-table";
import { usePosRegisterList } from "@/features/pos-registers/hooks/use-pos-register-list";
import {
  useCreatePosTerminalMutation,
  useDeletePosTerminalMutation,
  useGeneratePairingCodeMutation,
  useRevokePosTerminalDeviceMutation,
  useSetPosTerminalStatusMutation,
  useUpdatePosTerminalMutation,
} from "@/features/pos-registers/hooks/use-pos-terminal-mutations";
import {
  createEmptyPosRegisterFormValues,
  type PosRegister,
  type PosRegisterFormValues,
} from "@/features/pos-registers/types/pos-register";

type DialogState = {
  open: boolean;
  editingId: string | null;
  initialValues: PosRegisterFormValues;
  formKey: string;
};

type PairingCodeState = {
  open: boolean;
  posRegisterName: string;
  code: string;
  expiresAt: string;
};

function toFormValues(posRegister: PosRegister): PosRegisterFormValues {
  return {
    name: posRegister.name,
    moduleOverrides: posRegister.moduleOverrides,
    status: posRegister.status,
    nfceContingency: posRegister.nfceContingency,
    printerId: findPosOptionIdByLabel(POS_PRINTER_OPTIONS, posRegister.printer),
    scaleId: findPosOptionIdByLabel(POS_SCALE_OPTIONS, posRegister.scale),
    offlineServerId: posRegister.offlineServerId ?? "",
  };
}

/** Igualdade rasa suficiente: os mapas têm no máximo seis chaves conhecidas. */
function sameOverrides(
  a: Record<string, string> | null,
  b: Record<string, string> | null,
): boolean {
  if (a === null || b === null) return a === b;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function formatExpiresAt(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PosRegisterListPage() {
  const { branchId, branches } = useOrganization();
  const { search, setSearch, setPage, perPage, setPerPage, result, isLoading, isError, refresh } =
    usePosRegisterList();

  const createMutation = useCreatePosTerminalMutation();
  const saveModulesMutation = useSaveModulesForTerminal();
  const updateMutation = useUpdatePosTerminalMutation();
  const statusMutation = useSetPosTerminalStatusMutation();
  const deleteMutation = useDeletePosTerminalMutation();
  const pairingCodeMutation = useGeneratePairingCodeMutation();
  const revokeDeviceMutation = useRevokePosTerminalDeviceMutation();

  const [dialog, setDialog] = useState<DialogState>(() => ({
    open: false,
    editingId: null,
    initialValues: createEmptyPosRegisterFormValues(),
    formKey: "closed",
  }));

  const [pairingCode, setPairingCode] = useState<PairingCodeState>({
    open: false,
    posRegisterName: "",
    code: "",
    expiresAt: "",
  });

  // Terminal é vinculado à unidade ativa do cabeçalho — não há seletor no
  // formulário. Sem unidade escolhida (visão "todas as unidades" ou empresa
  // sem filial cadastrada) não há a quem vincular o cadastro.
  const resolvedBranchId = branchId ?? (branches.length === 1 ? branches[0]!.id : null);

  function openCreate() {
    if (!resolvedBranchId) {
      toast.error("Selecione uma unidade no cabeçalho para cadastrar um PDV.");
      return;
    }
    setDialog({
      open: true,
      editingId: null,
      initialValues: createEmptyPosRegisterFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(posRegister: PosRegister) {
    setDialog({
      open: true,
      editingId: posRegister.id,
      initialValues: toFormValues(posRegister),
      formKey: `edit-${posRegister.id}-${Date.now()}`,
    });
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) setDialog((prev) => ({ ...prev, open: false }));
  }

  async function handleSave(values: PosRegisterFormValues) {
    if (!values.name.trim()) {
      toast.error("Informe o nome do ponto de venda.");
      return;
    }

    // Os módulos têm rota própria e só podem ser salvos com o terminal já
    // existindo — no cadastro novo o id só nasce aqui. Por isso as duas
    // chamadas, nesta ordem.
    let terminalId = dialog.editingId;

    if (terminalId) {
      await updateMutation.mutateAsync({ id: terminalId, values });
    } else {
      if (!resolvedBranchId) {
        toast.error("Selecione uma unidade no cabeçalho para cadastrar um PDV.");
        return;
      }
      const created = await createMutation.mutateAsync({
        values,
        branchId: resolvedBranchId,
      });
      terminalId = created.id;
    }

    // Só chama quando mudou. Um PUT a cada save gravaria `{}` em terminal que
    // herdava, e ele deixaria de acompanhar o padrão da loja sem ninguém pedir.
    const previous = dialog.initialValues.moduleOverrides;
    if (terminalId && !sameOverrides(previous, values.moduleOverrides)) {
      await saveModulesMutation.mutateAsync({
        terminalId,
        modules: values.moduleOverrides as Record<
          string,
          "available" | "disabled" | "blocked"
        > | null,
      });
    }

    setDialog((prev) => ({ ...prev, open: false }));
  }

  async function handleToggleStatus(posRegister: PosRegister) {
    await statusMutation.mutateAsync({
      id: posRegister.id,
      status: posRegister.status === "active" ? "inactive" : "active",
    });
  }

  async function handleGeneratePairingCode(posRegister: PosRegister) {
    const result = await pairingCodeMutation.mutateAsync(posRegister.id);
    setPairingCode({
      open: true,
      posRegisterName: posRegister.name,
      code: result.code,
      expiresAt: result.expiresAt,
    });
  }

  async function handleCopyPairingCode() {
    try {
      await navigator.clipboard.writeText(pairingCode.code);
      toast.success("Código copiado");
    } catch {
      // Clipboard indisponível (contexto não seguro/permissão negada): o
      // código já está visível na tela para cópia manual.
    }
  }

  async function handleRevokeDevice(posRegister: PosRegister) {
    await revokeDeviceMutation.mutateAsync(posRegister.id);
  }

  async function handleDelete(posRegister: PosRegister) {
    await deleteMutation.mutateAsync(posRegister.id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="Pontos de venda"
        actions={
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <SearchInput
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome…"
              sx={{ width: { xs: "100%", sm: 224, md: 288 } }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={openCreate}
            >
              Novo PDV
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            gap: 2,
          }}
        >
          {isError && (
            <ListLoadErrorAlert
              title="Não foi possível carregar os pontos de venda"
              onRetry={refresh}
            />
          )}

          <PosRegisterListTable
            posRegisters={result.data}
            page={result.meta.page}
            total={result.meta.total}
            pageSize={perPage}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={setPerPage}
            onEdit={openEdit}
            onToggleStatus={handleToggleStatus}
            onGeneratePairingCode={handleGeneratePairingCode}
            onRevokeDevice={handleRevokeDevice}
            onDelete={handleDelete}
          />
        </Box>
      </ListPagePanel>

      <PosRegisterFormDialog
        open={dialog.open}
        title={dialog.editingId ? "Editar PDV" : "Novo PDV"}
        initialValues={dialog.initialValues}
        formKey={dialog.formKey}
        isSaving={isSaving}
        onOpenChange={handleDialogOpenChange}
        onSave={handleSave}
      />

      <Dialog
        open={pairingCode.open}
        onClose={() => setPairingCode((prev) => ({ ...prev, open: false }))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Código de pareamento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Informe este código no aplicativo do PDV{" "}
            <strong>{pairingCode.posRegisterName}</strong> para ativá-lo. Válido
            até {pairingCode.expiresAt ? formatExpiresAt(pairingCode.expiresAt) : "—"}.
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              px: 2,
              py: 1.5,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "action.hover",
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontFamily: "monospace", letterSpacing: 4 }}
            >
              {pairingCode.code}
            </Typography>
            <IconButton
              type="button"
              size="small"
              aria-label="Copiar código"
              onClick={() => void handleCopyPairingCode()}
            >
              <ContentCopyOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            variant="contained"
            onClick={() => setPairingCode((prev) => ({ ...prev, open: false }))}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </ListPageShell>
  );
}
