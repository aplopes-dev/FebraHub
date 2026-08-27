"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import AddIcon from "@mui/icons-material/Add";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  ConfirmationDialog,
  Drawer,
  SearchInput,
  toast,
} from "@/ui";
import { ServiceOrderStatusFormPanel } from "@/features/service-orders/components/service-order-status-form-panel";
import { ServiceOrderStatusSortableRow } from "@/features/service-orders/components/service-order-status-sortable-row";
import {
  createEmptyServiceOrderStatusFormValues,
  createServiceOrderStatus,
  listAllServiceOrderStatuses,
  removeServiceOrderStatus,
  reorderServiceOrderStatuses,
  serviceOrderStatusToFormValues,
  updateServiceOrderStatus,
} from "@/features/service-orders/services/service-order-status.service";
import { isServiceOrderStatusInUse } from "@/features/service-orders/services/service-order.service";
import type {
  ServiceOrderStatus,
  ServiceOrderStatusFormValues,
} from "@/features/service-orders/types/service-order-status";

type ServiceOrderStatusDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado após criar/editar/excluir/reordenar — refresh da listagem. */
  onChanged?: () => void;
};

type FormView =
  | { kind: "list" }
  | {
      kind: "form";
      mode: "create" | "edit";
      statusId?: string;
      initialValues: ServiceOrderStatusFormValues;
      formKey: string;
    };

export function ServiceOrderStatusDrawer({
  open,
  onOpenChange,
  onChanged,
}: ServiceOrderStatusDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Status de ordens de serviço"
      width={480}
    >
      {open ? <ServiceOrderStatusDrawerBody onChanged={onChanged} /> : null}
    </Drawer>
  );
}

function ServiceOrderStatusDrawerBody({
  onChanged,
}: {
  onChanged?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<ServiceOrderStatus[]>(() =>
    listAllServiceOrderStatuses(),
  );
  const [view, setView] = useState<FormView>({ kind: "list" });
  const [deleteTarget, setDeleteTarget] = useState<ServiceOrderStatus | null>(
    null,
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const canReorder = search.trim().length === 0;

  function refresh() {
    setItems(listAllServiceOrderStatuses());
    onChanged?.();
  }

  function openCreate() {
    setDeleteTarget(null);
    setView({
      kind: "form",
      mode: "create",
      initialValues: createEmptyServiceOrderStatusFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(status: ServiceOrderStatus) {
    setDeleteTarget(null);
    setView({
      kind: "form",
      mode: "edit",
      statusId: status.id,
      initialValues: serviceOrderStatusToFormValues(status),
      formKey: `edit-${status.id}-${Date.now()}`,
    });
  }

  function backToList() {
    setView({ kind: "list" });
  }

  function handleSave(values: ServiceOrderStatusFormValues) {
    if (view.kind !== "form") return;
    if (!values.name.trim()) {
      toast.error("Informe o nome do status.");
      return;
    }

    if (view.mode === "create") {
      createServiceOrderStatus(values);
      toast.success("Status criado.");
    } else if (view.statusId) {
      updateServiceOrderStatus(view.statusId, values);
      toast.success("Status atualizado.");
    }

    setView({ kind: "list" });
    refresh();
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
    setItems(next);
    reorderServiceOrderStatuses(next.map((item) => item.id));
    toast.success("Ordem dos status atualizada.");
    onChanged?.();
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (isServiceOrderStatusInUse(deleteTarget.id)) {
      toast.error(
        "Não é possível excluir: este status está em uso por ordens de serviço.",
      );
      setDeleteTarget(null);
      return;
    }
    removeServiceOrderStatus(deleteTarget.id);
    toast.success("Status excluído.");
    setDeleteTarget(null);
    refresh();
  }

  if (view.kind === "form") {
    return (
      <ServiceOrderStatusFormPanel
        mode={view.mode}
        initialValues={view.initialValues}
        formKey={view.formKey}
        onCancel={backToList}
        onSave={handleSave}
      />
    );
  }

  return (
    <>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Cadastre, edite e reordene os status usados nas OSs. Cada status
        pertence a uma etapa (tipo-base) que organiza as abas da listagem.
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar status…"
            sx={{ flex: 1, minWidth: 0 }}
            slotProps={{
              htmlInput: { "aria-label": "Buscar status" },
            }}
          />
          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={openCreate}
            sx={{ flexShrink: 0 }}
          >
            Novo
          </Button>
        </Stack>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {canReorder
            ? "Arraste para alterar a ordem de exibição."
            : "Limpe a busca para reordenar os status."}
        </Typography>
      </Stack>

      {filteredItems.length === 0 ? (
        <Typography
          variant="body2"
          sx={{ py: 6, textAlign: "center", color: "text.secondary" }}
        >
          Nenhum status encontrado.
        </Typography>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredItems.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1}>
              {filteredItems.map((status) => (
                <ServiceOrderStatusSortableRow
                  key={status.id}
                  status={status}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Excluir status?"
        description={
          deleteTarget
            ? `O status “${deleteTarget.name}” será removido permanentemente. Status em uso por ordens de serviço não podem ser excluídos.`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
