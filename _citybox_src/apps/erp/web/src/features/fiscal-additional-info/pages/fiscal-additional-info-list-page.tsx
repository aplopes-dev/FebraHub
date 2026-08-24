"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  PageHeader,
  ScrollArea,
  SearchInput,
  Tab,
  Tabs,
} from "@citybox/mui";
import { RowActionsMenu } from "@/components/ui/list-page";
import {
  DOCUMENT_TYPE_LABEL,
  FISCAL_DOCUMENT_TYPES,
  TARGET_LABEL,
  isFiscalDocumentType,
  type FiscalDocumentType,
} from "@/features/fiscal-additional-info/lib/document-type-options";
import { useFiscalAdditionalInfosQuery } from "@/features/fiscal-additional-info/hooks/use-fiscal-additional-info-queries";
import {
  useCreateFiscalAdditionalInfoMutation,
  useDeleteFiscalAdditionalInfoMutation,
  useUpdateFiscalAdditionalInfoMutation,
} from "@/features/fiscal-additional-info/hooks/use-fiscal-additional-info-mutations";
import type { FiscalAdditionalInfo } from "@/features/fiscal-additional-info/api/fiscal-additional-info.dto";
import {
  FiscalAdditionalInfoFormDialog,
  type FiscalAdditionalInfoFormValues,
} from "@/features/fiscal-additional-info/components/fiscal-additional-info-form-dialog";

const BASE_PATH = "/configuracoes/fiscal/informacoes-adicionais";

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  infoId?: string;
  initialValues: FiscalAdditionalInfoFormValues;
  formKey: string;
};

function createEmptyValues(): FiscalAdditionalInfoFormValues {
  return { name: "", text: "", target: "INF_CPL" };
}

function toFormValues(
  info: FiscalAdditionalInfo,
): FiscalAdditionalInfoFormValues {
  return { name: info.name, text: info.text, target: info.target };
}

export function FiscalAdditionalInfoListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawType = searchParams.get("tipo");
  const activeType: FiscalDocumentType =
    rawType && isFiscalDocumentType(rawType) ? rawType : "NFE";

  const [search, setSearch] = useState("");

  const infosQuery = useFiscalAdditionalInfosQuery(activeType);
  const createMutation = useCreateFiscalAdditionalInfoMutation();
  const updateMutation = useUpdateFiscalAdditionalInfoMutation();
  const deleteMutation = useDeleteFiscalAdditionalInfoMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<DialogState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyValues(),
    formKey: "closed",
  }));
  // Sequência monotônica para remontar o corpo do Dialog a cada abertura, sem
  // `Date.now()` (impuro no lint). Incrementar um ref em handler é permitido.
  const formSeq = useRef(0);

  const infos = useMemo(() => {
    const all = infosQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (info) =>
        info.name.toLowerCase().includes(term) ||
        info.text.toLowerCase().includes(term),
    );
  }, [infosQuery.data, search]);

  function handleTabChange(next: FiscalDocumentType) {
    if (next === activeType) return;
    // Cada aba é um dataset diferente (outro `documentType`), não um filtro sobre
    // a mesma lista — carregar a busca de uma aba para outra confundiria (lista
    // "vazia" que na verdade tem registros, só não batem no termo antigo).
    setSearch("");
    const params = new URLSearchParams(searchParams);
    params.set("tipo", next);
    router.replace(`${BASE_PATH}?${params.toString()}`);
  }

  function openCreate() {
    setDialog({
      open: true,
      mode: "create",
      initialValues: createEmptyValues(),
      formKey: `create-${activeType}-${(formSeq.current += 1)}`,
    });
  }

  function openEdit(info: FiscalAdditionalInfo) {
    setDialog({
      open: true,
      mode: "edit",
      infoId: info.id,
      initialValues: toFormValues(info),
      formKey: `edit-${info.id}-${(formSeq.current += 1)}`,
    });
  }

  function closeDialog() {
    setDialog((prev) => ({ ...prev, open: false }));
  }

  function handleSave(values: FiscalAdditionalInfoFormValues) {
    if (dialog.mode === "create") {
      createMutation.mutate(
        {
          name: values.name,
          text: values.text,
          documentType: activeType,
          target: values.target,
        },
        { onSuccess: closeDialog },
      );
      return;
    }
    if (!dialog.infoId) return;
    updateMutation.mutate(
      {
        id: dialog.infoId,
        payload: {
          name: values.name,
          text: values.text,
          target: values.target,
        },
      },
      { onSuccess: closeDialog },
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <PageHeader
        sx={{ flexShrink: 0, mb: 0, px: 3, pt: 3, pb: 2 }}
        title="Informações adicionais"
        description="Textos fixos que entram automaticamente nas notas fiscais, por tipo de documento."
        actions={
          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={openCreate}
          >
            Nova informação
          </Button>
        }
      />

      <Tabs
        value={activeType}
        aria-label="Tipo de documento fiscal"
        onChange={(_, next: FiscalDocumentType) => handleTabChange(next)}
        sx={{
          flexShrink: 0,
          px: 3,
          minHeight: 44,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        {FISCAL_DOCUMENT_TYPES.map((type) => (
          <Tab
            key={type}
            value={type}
            label={DOCUMENT_TYPE_LABEL[type]}
            id={`info-adicional-tab-${type}`}
            aria-controls={`info-adicional-tabpanel-${type}`}
            sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
          />
        ))}
      </Tabs>

      <ScrollArea
        sx={{ flex: 1, minHeight: 0, minWidth: 0 }}
        role="tabpanel"
        id={`info-adicional-tabpanel-${activeType}`}
        aria-labelledby={`info-adicional-tab-${activeType}`}
      >
        <Box sx={{ px: 3, pb: 4, pt: 2, minWidth: 0 }}>
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou texto…"
            sx={{ width: { xs: "100%", sm: 288 }, mb: 2 }}
          />

          {infosQuery.isPending ? (
            <Skeleton variant="rounded" height={240} />
          ) : infosQuery.isError ? (
            <Alert severity="error">
              Não foi possível carregar as informações adicionais.
            </Alert>
          ) : infos.length === 0 ? (
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                px: 2,
                py: 4,
                textAlign: "center",
              }}
            >
              {search.trim() ? (
                <>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Nenhum resultado para “{search.trim()}” em{" "}
                    {DOCUMENT_TYPE_LABEL[activeType]}.
                  </Typography>
                  <Button
                    type="button"
                    variant="text"
                    size="small"
                    onClick={() => setSearch("")}
                    sx={{ mt: 1 }}
                  >
                    Limpar busca
                  </Button>
                </>
              ) : (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Nenhuma informação adicional cadastrada para{" "}
                  {DOCUMENT_TYPE_LABEL[activeType]}.
                </Typography>
              )}
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {infos.map((info) => (
                  <TableRow key={info.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{info.name}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 360,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "text.secondary",
                      }}
                    >
                      {info.text}
                    </TableCell>
                    <TableCell>{TARGET_LABEL[info.target]}</TableCell>
                    <TableCell align="right">
                      <RowActionsMenu
                        ariaLabel={`Ações de ${info.name}`}
                        items={[
                          {
                            id: "edit",
                            label: "Editar",
                            onClick: () => openEdit(info),
                          },
                          { id: "delete", label: "Excluir" },
                        ]}
                        confirmDelete={{
                          title: "Excluir informação adicional",
                          description: `A informação "${info.name}" deixará de entrar nas próximas notas. Deseja continuar?`,
                          confirmLabel: "Excluir",
                          onConfirm: () =>
                            deleteMutation.mutateAsync(info.id),
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </ScrollArea>

      <FiscalAdditionalInfoFormDialog
        open={dialog.open}
        mode={dialog.mode}
        documentType={activeType}
        initialValues={dialog.initialValues}
        formKey={dialog.formKey}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </Box>
  );
}
