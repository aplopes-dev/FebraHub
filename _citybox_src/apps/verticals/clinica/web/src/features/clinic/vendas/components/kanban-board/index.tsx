"use client";

import { useState, useMemo, useCallback, useRef } from "react";

import { toast } from "sonner";
import { KanbanProvider } from "@citybox/ui/organisms";
import { ConfirmDialog } from "@citybox/ui/organisms";

import type {
  Funnel,
  KanbanColumn as KanbanColumnType,
  KanbanCard,
} from "../../types";
import { AddColumnButton } from "./add-column-button";
import { ColumnModal } from "./column-modal";
import { ConfirmChangeStageModal } from "../confirm-change-stage-modal";
import {
  SalesKanbanColumn,
  type SalesKanbanColumnData,
  type SalesKanbanItem,
} from "./sales-kanban-column";
import { SalesKanbanCard } from "./sales-kanban-card";

interface SalesKanbanBoardProps {
  funnel: Funnel;
  cards: KanbanCard[];
  /** Sem manage: só visualização (sem arrastar / criar etapas). */
  canManage?: boolean;
  onColumnsChange: (columns: KanbanColumnType[]) => void;
  /** Atualiza o estado local dos cards durante o arraste (preview otimista). */
  onCardsChange?: (cards: KanbanCard[]) => void;
  /** Reverte o estado local (ex.: ao cancelar a confirmação de ganha/perdida). */
  onMoveRevert?: () => void;
  onCardClick?: (card: KanbanCard) => void;
  /** Move entre colunas — recebe o snapshot final dos cards (ordem + coluna). */
  onMove: (
    cardId: string,
    toColumnId: string,
    orderedCards: KanbanCard[],
    fromColumnId?: string | null,
  ) => void;
  /** Reordena cards na mesma coluna. */
  onReorder: (orderedCards: KanbanCard[], columnId: string) => void;
  isMoving?: boolean;
}

type PendingStageChange = {
  cardId: string;
  cardTitle: string;
  toColumnId: string;
  fromColumnId: string | null;
  columnName: string;
  columnType: "completed" | "lost";
  orderedCards: KanbanCard[];
};

function toKanbanCards(items: SalesKanbanItem[]): KanbanCard[] {
  return items.map(({ column, ...rest }) => ({
    ...(rest as KanbanCard),
    columnId: column,
  }));
}

export function SalesKanbanBoard({
  funnel,
  cards,
  canManage = true,
  onColumnsChange,
  onCardsChange,
  onMoveRevert,
  onCardClick,
  onMove,
  onReorder,
  isMoving = false,
}: SalesKanbanBoardProps) {
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [columnToRename, setColumnToRename] = useState<KanbanColumnType | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<KanbanColumnType | null>(null);
  const [pendingStageChange, setPendingStageChange] =
    useState<PendingStageChange | null>(null);

  const sortedColumns = useMemo(
    () => [...funnel.columns].sort((a, b) => a.order - b.order),
    [funnel.columns],
  );

  const dsColumns = useMemo<SalesKanbanColumnData[]>(
    () => [
      ...sortedColumns.map((col) => ({
        id: col.id,
        name: col.name,
        color: col.color,
        type: col.type,
        isEditable: canManage && col.isEditable,
        isDraggable: canManage && col.isDraggable,
      })),
      ...(canManage
        ? [
            {
              id: "__add_column__",
              name: "",
              type: "custom" as const,
              isEditable: false,
              isDraggable: false,
              isAddColumn: true,
            },
          ]
        : []),
    ],
    [sortedColumns, canManage],
  );

  const data = useMemo<SalesKanbanItem[]>(
    () =>
      cards.map(
        (card) => ({ ...card, column: card.columnId }) as SalesKanbanItem,
      ),
    [cards],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const col of sortedColumns) {
      map[col.id] = data.filter((item) => item.column === col.id).length;
    }
    return map;
  }, [sortedColumns, data]);

  const handleCardDrop = useCallback(
    (
      next: SalesKanbanItem[],
      meta: { cardId: string; fromColumn: string | null; toColumn: string },
    ) => {
      if (!canManage) return;
      const mapped = toKanbanCards(next);
      onCardsChange?.(mapped);

      if (!meta.fromColumn || meta.fromColumn === meta.toColumn) {
        onReorder(mapped, meta.toColumn);
        return;
      }

      const targetColumn = sortedColumns.find((col) => col.id === meta.toColumn);
      if (!targetColumn) return;

      if (targetColumn.type === "completed" || targetColumn.type === "lost") {
        const card = mapped.find((c) => c.id === meta.cardId);
        if (card?.budgetId) {
          toast.error(
            "Oportunidades de orçamento só vão para Ganha ou Perdida ao aprovar ou reprovar o orçamento",
          );
          onMoveRevert?.();
          return;
        }
        setPendingStageChange({
          cardId: meta.cardId,
          cardTitle: card?.title ?? "",
          toColumnId: meta.toColumn,
          fromColumnId: meta.fromColumn,
          columnName: targetColumn.name,
          columnType: targetColumn.type,
          orderedCards: mapped,
        });
        return;
      }

      onMove(meta.cardId, meta.toColumn, mapped, meta.fromColumn);
    },
    [canManage, sortedColumns, onCardsChange, onReorder, onMove, onMoveRevert],
  );

  // Distingue "confirmar" de "cancelar" no fechamento do modal de ganha/perdida.
  const stageConfirmedRef = useRef(false);

  const handleConfirmStageChange = useCallback(() => {
    if (!pendingStageChange) return;
    stageConfirmedRef.current = true;
    onMove(
      pendingStageChange.cardId,
      pendingStageChange.toColumnId,
      pendingStageChange.orderedCards,
      pendingStageChange.fromColumnId,
    );
    setPendingStageChange(null);
  }, [pendingStageChange, onMove]);

  const handleStageModalOpenChange = useCallback(
    (open: boolean) => {
      if (open) return;
      // Cancelou (fechou sem confirmar) → reverte o card para a coluna original.
      if (!stageConfirmedRef.current) onMoveRevert?.();
      stageConfirmedRef.current = false;
      setPendingStageChange(null);
    },
    [onMoveRevert],
  );

  // ----- Colunas (etapas) -----

  // Reordena apenas colunas móveis. Agendada (completed) e Perdida (lost)
  // ficam sempre no fim (orders 998/999) — nunca depois delas.
  const handleColumnReorder = useCallback(
    (activeId: string, overId: string) => {
      const ordered = [...funnel.columns].sort((a, b) => a.order - b.order);
      const isTerminal = (col: KanbanColumnType) =>
        col.type === "completed" || col.type === "lost";

      const movable = ordered.filter((col) => !isTerminal(col));
      const won = ordered.find((col) => col.type === "completed");
      const lost = ordered.find((col) => col.type === "lost");

      const fromIdx = movable.findIndex((col) => col.id === activeId);
      // Agendada/Perdida nunca são arrastadas.
      if (fromIdx === -1) return;

      let toIdx = movable.findIndex((col) => col.id === overId);
      if (toIdx === -1) {
        // Soltou em Agendada, Perdida ou "Criar etapa" → vai para o fim
        // das móveis (ainda antes das terminais).
        const overColumn = ordered.find((col) => col.id === overId);
        const overIsPinnedEnd =
          overId === "__add_column__" ||
          overId === won?.id ||
          overId === lost?.id ||
          (overColumn != null && isTerminal(overColumn));
        if (!overIsPinnedEnd) return;
        toIdx = movable.length - 1;
      }

      if (fromIdx === toIdx) return;

      const reordered = [...movable];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);

      const updated: KanbanColumnType[] = [
        ...reordered.map((col, index) => ({ ...col, order: index })),
        ...(won ? [{ ...won, order: 998 }] : []),
        ...(lost ? [{ ...lost, order: 999 }] : []),
      ];
      onColumnsChange(updated);
    },
    [funnel.columns, onColumnsChange],
  );

  const handleAddColumn = () => {
    setModalMode("create");
    setColumnToRename(null);
    setIsModalOpen(true);
  };

  const handleRenameColumn = (columnId: string) => {
    const column = funnel.columns.find((c) => c.id === columnId);
    if (column) {
      setModalMode("edit");
      setColumnToRename(column);
      setIsModalOpen(true);
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = funnel.columns.find((c) => c.id === columnId);
    if (column) setColumnToDelete(column);
  };

  const handleModalSubmit = (name: string, color?: string) => {
    if (modalMode === "create") {
      const ordered = [...funnel.columns].sort((a, b) => a.order - b.order);
      const movable = ordered.filter(
        (c) => c.type !== "completed" && c.type !== "lost",
      );
      const won = ordered.find((c) => c.type === "completed");
      const lost = ordered.find((c) => c.type === "lost");
      const newColumn: KanbanColumnType = {
        id: `col-${Date.now()}`,
        name,
        type: "custom",
        order: movable.length,
        isEditable: true,
        isDraggable: true,
        color: color || "#94a3b8",
      };
      // Sempre antes de Agendada/Perdida — nunca depois.
      onColumnsChange([
        ...movable.map((col, index) => ({ ...col, order: index })),
        { ...newColumn, order: movable.length },
        ...(won ? [{ ...won, order: 998 }] : []),
        ...(lost ? [{ ...lost, order: 999 }] : []),
      ]);
    } else if (columnToRename) {
      const updatedColumns = funnel.columns.map((c) =>
        c.id === columnToRename.id
          ? { ...c, name, color: color || c.color || "#94a3b8" }
          : c,
      );
      onColumnsChange(updatedColumns);
    }
  };

  const handleConfirmDelete = () => {
    if (!columnToDelete) return;
    if (
      columnToDelete.type === "completed" ||
      columnToDelete.type === "lost"
    ) {
      setColumnToDelete(null);
      return;
    }
    const remaining = funnel.columns.filter((c) => c.id !== columnToDelete.id);
    const ordered = [...remaining].sort((a, b) => a.order - b.order);
    const movable = ordered.filter(
      (c) => c.type !== "completed" && c.type !== "lost",
    );
    const won = ordered.find((c) => c.type === "completed");
    const lost = ordered.find((c) => c.type === "lost");
    onColumnsChange([
      ...movable.map((col, index) => ({ ...col, order: index })),
      ...(won ? [{ ...won, order: 998 }] : []),
      ...(lost ? [{ ...lost, order: 999 }] : []),
    ]);
    setColumnToDelete(null);
  };

  return (
    <>
      <KanbanProvider<SalesKanbanItem, SalesKanbanColumnData>
        columns={dsColumns}
        data={data}
        onDataChange={(next) => {
          if (!canManage) return;
          onCardsChange?.(toKanbanCards(next));
        }}
        onCardDrop={handleCardDrop}
        onColumnReorder={canManage ? handleColumnReorder : undefined}
        isColumnSortable={(c) => canManage && c.isDraggable === true}
        className="min-h-0 min-w-0 flex-1"
        renderOverlay={(item) => <SalesKanbanCard card={item} isDraggable />}
      >
        {(column) =>
          column.isAddColumn === true ? (
            <AddColumnButton key="__add_column__" onClick={handleAddColumn} />
          ) : (
            <SalesKanbanColumn
              key={column.id}
              column={column}
              count={counts[column.id] ?? 0}
              canManage={canManage}
              onCardClick={onCardClick}
              onEdit={handleRenameColumn}
              onDelete={handleDeleteColumn}
            />
          )
        }
      </KanbanProvider>

      <ColumnModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleModalSubmit}
        mode={modalMode}
        initialName={columnToRename?.name}
        initialColor={columnToRename?.color}
      />

      <ConfirmDialog
        open={columnToDelete !== null}
        onOpenChange={(open) => !open && setColumnToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir etapa"
        description={`Tem certeza que deseja excluir a etapa "${columnToDelete?.name}"? As oportunidades desta etapa deixarão de aparecer no funil.`}
        confirmVariant="destructive"
        confirmLabel="Excluir"
      />

      {pendingStageChange && (
        <ConfirmChangeStageModal
          open={pendingStageChange !== null}
          onOpenChange={handleStageModalOpenChange}
          onConfirm={handleConfirmStageChange}
          stageName={pendingStageChange.columnName}
          stageType={pendingStageChange.columnType}
          opportunityTitle={pendingStageChange.cardTitle}
          isLoading={isMoving}
        />
      )}
    </>
  );
}
