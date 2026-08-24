"use client";

import { useMemo, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import Stack from "@mui/material/Stack";
import { Button, PageHeader, SearchInput, toast } from "@citybox/mui";
import { ListPagePanel } from "@/components/ui/data-table";
import { ListPageShell } from "@/components/ui/list-page";
import { KdsFormDialog } from "@/features/kds/components/kds-form-dialog";
import { KdsListTable } from "@/features/kds/components/kds-list-table";
import { useKdsList } from "@/features/kds/hooks/use-kds-list";
import {
  createKds,
  deleteKds,
  setKdsStatus,
  updateKds,
} from "@/features/kds/services/kds.service";
import {
  KDS_STATUS_LABELS,
  createEmptyKdsFormValues,
  kdsToFormValues,
  type Kds,
  type KdsFormValues,
  type KdsStatus,
} from "@/features/kds/types/kds";

type DialogState = {
  open: boolean;
  /** `null` = criação. */
  editingId: string | null;
  title: string;
  initialValues: KdsFormValues;
  formKey: string;
};

const CLOSED_DIALOG: DialogState = {
  open: false,
  editingId: null,
  title: "Novo KDS",
  initialValues: createEmptyKdsFormValues(),
  formKey: "closed",
};

export function KdsListPage() {
  const { search, setSearch, setPage, perPage, setPerPage, result } =
    useKdsList();

  const [dialog, setDialog] = useState<DialogState>(CLOSED_DIALOG);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const pageIds = result.data.map((kds) => kds.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedSet.has(id));
  const somePageSelected = pageIds.some((id) => selectedSet.has(id));

  function toggleSelected(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function toggleSelectAllPage() {
    setSelectedIds((prev) =>
      allPageSelected
        ? prev.filter((id) => !pageIds.includes(id))
        : [...new Set([...prev, ...pageIds])],
    );
  }

  function openCreate() {
    setDialog({
      open: true,
      editingId: null,
      title: "Novo KDS",
      initialValues: createEmptyKdsFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(kds: Kds) {
    setDialog({
      open: true,
      editingId: kds.id,
      title: `Editar ${kds.name}`,
      initialValues: kdsToFormValues(kds),
      formKey: `edit-${kds.id}-${Date.now()}`,
    });
  }

  function handleSave(values: KdsFormValues) {
    if (!values.name.trim()) {
      toast.error("Informe o nome do KDS.");
      return;
    }

    if (dialog.editingId) {
      const updated = updateKds(dialog.editingId, values);
      if (!updated) {
        toast.error("Não foi possível salvar este KDS.");
        return;
      }
      toast.success("KDS salvo.", { description: updated.name });
    } else {
      const created = createKds(values);
      toast.success("KDS cadastrado.", { description: created.name });
    }

    setDialog((prev) => ({ ...prev, open: false }));
  }

  function handleChangeStatus(kds: Kds, status: KdsStatus) {
    const updated = setKdsStatus(kds.id, status);
    if (!updated) {
      toast.error("Não foi possível alterar o status deste KDS.");
      return;
    }
    toast.success(`KDS marcado como ${KDS_STATUS_LABELS[status].toLowerCase()}.`, {
      description: updated.name,
    });
  }

  function handleDelete(kds: Kds) {
    const deleted = deleteKds(kds.id);
    if (!deleted) {
      toast.error("Não foi possível excluir este KDS.");
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => id !== kds.id));
    toast.success("KDS excluído.", { description: kds.name });
  }

  return (
    <ListPageShell>
      <PageHeader
        sx={{ flexShrink: 0, mb: 0 }}
        title="KDS"
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
              Novo KDS
            </Button>
          </Stack>
        }
      />

      <ListPagePanel>
        <KdsListTable
          kdsList={result.data}
          page={result.meta.page}
          perPage={perPage}
          total={result.meta.total}
          selectedIds={selectedSet}
          allPageSelected={allPageSelected}
          somePageSelected={somePageSelected}
          onToggleSelected={toggleSelected}
          onToggleSelectAllPage={toggleSelectAllPage}
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          onEdit={openEdit}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
        />
      </ListPagePanel>

      <KdsFormDialog
        open={dialog.open}
        title={dialog.title}
        initialValues={dialog.initialValues}
        formKey={dialog.formKey}
        onOpenChange={(open) =>
          setDialog((prev) => (open ? prev : { ...prev, open: false }))
        }
        onSave={handleSave}
      />
    </ListPageShell>
  );
}
