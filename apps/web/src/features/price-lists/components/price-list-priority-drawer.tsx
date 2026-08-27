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
import { Button, Drawer, Stack, Typography } from "@/ui";
import { PriceListPriorityRow } from "@/features/price-lists/components/price-list-priority-row";
import type { PriceList } from "@/features/price-lists/types/price-list";

type PriceListPriorityDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceLists: PriceList[];
  onSave: (orderedIds: string[]) => void;
  isSaving?: boolean;
};

export function PriceListPriorityDrawer({
  open,
  onOpenChange,
  priceLists,
  onSave,
  isSaving = false,
}: PriceListPriorityDrawerProps) {
  const sessionKey = useMemo(
    () => priceLists.map((list) => `${list.id}:${list.priority}`).join("|"),
    [priceLists],
  );

  if (!open) {
    return (
      <Drawer
        open={false}
        onClose={() => onOpenChange(false)}
        title="Priorizar listas"
        width={480}
      >
        {null}
      </Drawer>
    );
  }

  return (
    <PriceListPriorityDrawerSession
      key={sessionKey}
      priceLists={priceLists}
      onOpenChange={onOpenChange}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

type SessionProps = {
  priceLists: PriceList[];
  onOpenChange: (open: boolean) => void;
  onSave: (orderedIds: string[]) => void;
  isSaving: boolean;
};

function PriceListPriorityDrawerSession({
  priceLists,
  onOpenChange,
  onSave,
  isSaving,
}: SessionProps) {
  const [order, setOrder] = useState(() => [...priceLists]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => order.map((list) => list.id), [order]);

  function handleDragEnd(event: DragEndEvent) {
    if (isSaving) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((list) => list.id === active.id);
    const newIndex = order.findIndex((list) => list.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder((prev) => arrayMove(prev, oldIndex, newIndex));
  }

  return (
    <Drawer
      open
      onClose={() => {
        if (!isSaving) onOpenChange(false);
      }}
      title="Priorizar listas"
      width={480}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            loading={isSaving}
            disabled={isSaving}
            onClick={() => onSave(order.map((list) => list.id))}
          >
            Salvar prioridade
          </Button>
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Arraste para definir a prioridade de aplicação. A lista no topo tem
        maior prioridade quando houver conflito na venda.
      </Typography>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <Stack spacing={1}>
            {order.map((list, index) => (
              <PriceListPriorityRow
                key={list.id}
                priceList={list}
                position={index + 1}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
    </Drawer>
  );
}
