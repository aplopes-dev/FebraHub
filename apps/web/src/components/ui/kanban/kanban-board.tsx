"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { DraggableAttributes } from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ScrollArea, Box } from "@/ui";

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export type KanbanItem = {
  id: string;
  /** Coluna em que o item está. */
  column: string;
} & Record<string, unknown>;

export type KanbanColumn = {
  id: string;
  name: string;
} & Record<string, unknown>;

type KanbanContextValue = {
  data: KanbanItem[];
  activeCardId: string | null;
};

const KanbanContext = createContext<KanbanContextValue>({
  data: [],
  activeCardId: null,
});

type KanbanColumnDndValue = {
  sortable: boolean;
  attributes?: DraggableAttributes;
  listeners?: ReturnType<typeof useSortable>["listeners"];
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
};

const KanbanColumnDndContext = createContext<KanbanColumnDndValue>({
  sortable: false,
});

/** Coluna do board: zona de drop que agrupa cabeçalho + cards. */
export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
  /**
   * Permite arrastar a coluna para reordenar (somente pelo `KanbanColumnHandle`).
   * Colunas fixas devem passar `false` — elas continuam recebendo cards (drop),
   * apenas não podem ser movidas.
   */
  sortable?: boolean;
};

export function KanbanBoard({
  id,
  children,
  className,
  sortable = false,
}: KanbanBoardProps) {
  const {
    isOver,
    setNodeRef,
    attributes,
    listeners,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "column" },
    // Coluna não-sortable continua sendo alvo de drop de cards.
    disabled: { draggable: !sortable, droppable: false },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <KanbanColumnDndContext.Provider
      value={{ sortable, attributes, listeners, setActivatorNodeRef }}
    >
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex h-full min-h-40 flex-col rounded-2xl border border-border/50 bg-muted/20 ring-2 transition-colors",
          isOver ? "ring-primary/40" : "ring-transparent",
          isDragging && "z-10 opacity-70",
          className,
        )}
      >
        {children}
      </div>
    </KanbanColumnDndContext.Provider>
  );
}

/** Alça de arraste da coluna: só a partir dela a coluna pode ser movida. */
export type KanbanColumnHandleProps = HTMLAttributes<HTMLButtonElement>;

export function KanbanColumnHandle({
  className,
  children,
  ...props
}: KanbanColumnHandleProps) {
  const { sortable, attributes, listeners, setActivatorNodeRef } = useContext(
    KanbanColumnDndContext,
  );

  if (!sortable) return null;

  return (
    <button
      type="button"
      ref={setActivatorNodeRef}
      className={cn(
        "flex cursor-grab touch-none items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing",
        className,
      )}
      {...attributes}
      {...listeners}
      {...props}
    >
      {children}
    </button>
  );
}

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export function KanbanHeader({ className, ...props }: KanbanHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-border/50 px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export type KanbanCardsProps<T extends KanbanItem = KanbanItem> = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "id"
> & {
  id: string;
  children: (item: T) => ReactNode;
  /** Conteúdo exibido quando a coluna não tem cards. */
  emptyState?: ReactNode;
};

export function KanbanCards<T extends KanbanItem = KanbanItem>({
  id,
  children,
  className,
  emptyState,
  ...props
}: KanbanCardsProps<T>) {
  const { data } = useContext(KanbanContext);
  const items = data.filter((item) => item.column === id) as T[];
  const ids = items.map((item) => item.id);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <SortableContext items={ids}>
        <div className={cn("flex flex-col gap-3 p-3", className)} {...props}>
          {items.length > 0 ? items.map(children) : emptyState}
        </div>
      </SortableContext>
    </ScrollArea>
  );
}

export type KanbanCardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export function KanbanCard({ id, children, className }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, data: { type: "card" } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        className,
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export type KanbanProviderProps<
  T extends KanbanItem = KanbanItem,
  C extends KanbanColumn = KanbanColumn,
> = {
  columns: C[];
  data: T[];
  children: (column: C) => ReactNode;
  className?: string;
  /** Disparado ao soltar um card em coluna diferente da de origem. */
  onColumnChange?: (cardId: string, toColumn: string, fromColumn: string) => void;
  /**
   * Estado controlado dos cards. Quando fornecido, o board move o card de forma
   * otimista DURANTE o arraste (preview ao vivo, sem "snapback" no drop). O pai
   * deve manter `data` em estado local e refleti-lo aqui.
   */
  onDataChange?: (data: T[]) => void;
  /**
   * Disparado uma vez ao soltar um card (mesma coluna ou outra), com o array
   * final já reordenado. Use para persistir `sortOrder` sem depender do setState
   * assíncrono do pai.
   */
  onCardDrop?: (
    data: T[],
    meta: { cardId: string; fromColumn: string | null; toColumn: string },
  ) => void;
  /** Conteúdo renderizado no overlay enquanto o card é arrastado. */
  renderOverlay?: (item: T) => ReactNode;
  /**
   * Habilita o reordenamento de colunas por arraste. Disparado ao soltar uma
   * coluna sobre outra. Só passe se o board deve permitir mover colunas — o
   * food/pedidos, por exemplo, não passa (mantém o comportamento atual).
   */
  onColumnReorder?: (activeColumnId: string, overColumnId: string) => void;
  /** Define quais colunas podem ser arrastadas (entram no SortableContext). */
  isColumnSortable?: (column: C) => boolean;
};

export function KanbanProvider<
  T extends KanbanItem = KanbanItem,
  C extends KanbanColumn = KanbanColumn,
>({
  columns,
  data,
  children,
  className,
  onColumnChange,
  onDataChange,
  onCardDrop,
  renderOverlay,
  onColumnReorder,
  isColumnSortable,
}: KanbanProviderProps<T, C>) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  // Coluna de origem do card no início do arraste (para o onColumnChange no drop,
  // já que a coluna do card muda de forma otimista durante o onDragOver).
  const dragStartColumnRef = useRef<string | null>(null);
  // Última coluna vista no dragOver — mais confiável que `data` no momento do drop
  // (React pode ainda não ter commitado o onDataChange).
  const dragCurrentColumnRef = useRef<string | null>(null);

  const sortableColumnIds = useMemo(
    () =>
      onColumnReorder
        ? columns
            .filter(
              (column) =>
                !(
                  "isAddColumn" in column &&
                  (column as { isAddColumn?: boolean }).isAddColumn
                ),
            )
            .map((c) => c.id)
        : [],
    [columns, onColumnReorder],
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

  // Preferir o que está sob o ponteiro; fallback para centro mais próximo.
  const collisionDetection: CollisionDetection = (args) => {
    const pointerHits = pointerWithin(args);
    if (pointerHits.length > 0) return pointerHits;
    return closestCenter(args);
  };

  const activeItem = useMemo(
    () => (activeCardId ? data.find((item) => item.id === activeCardId) ?? null : null),
    [data, activeCardId],
  );

  const resolveColumn = (overId: string): string | null => {
    const overItem = data.find((item) => item.id === overId);
    if (overItem) return overItem.column;
    const column = columns.find((candidate) => candidate.id === overId);
    // Coluna sintética "adicionar etapa" não é alvo de drop.
    if (
      column &&
      !("isAddColumn" in column && (column as { isAddColumn?: boolean }).isAddColumn)
    ) {
      return overId;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    // Colunas não usam o DragOverlay de card.
    if (event.active.data.current?.type === "column") return;
    const card = data.find((item) => item.id === event.active.id);
    dragStartColumnRef.current = card?.column ?? null;
    dragCurrentColumnRef.current = card?.column ?? null;
    setActiveCardId(String(event.active.id));
  };

  // Move o card de forma otimista durante o arraste (preview ao vivo).
  const handleDragOver = (event: DragOverEvent) => {
    if (!onDataChange) return;
    if (event.active.data.current?.type === "column") return;

    const { active, over } = event;
    if (!over) return;

    const activeItem = data.find((item) => item.id === active.id);
    if (!activeItem) return;

    const overColumn = resolveColumn(String(over.id));
    if (!overColumn || overColumn === activeItem.column) return;

    dragCurrentColumnRef.current = overColumn;

    const activeIndex = data.findIndex((item) => item.id === active.id);
    const overIndex = data.findIndex((item) => item.id === over.id);

    const next = data.map((item, index) =>
      index === activeIndex ? { ...item, column: overColumn } : item,
    );
    const insertAt = overIndex === -1 ? next.length - 1 : overIndex;
    onDataChange(arrayMove(next, activeIndex, insertAt));
  };

  const handleDragCancel = () => {
    const startColumn = dragStartColumnRef.current;
    const activeId = activeCardId;
    setActiveCardId(null);
    dragStartColumnRef.current = null;
    dragCurrentColumnRef.current = null;
    if (onDataChange && startColumn && activeId) {
      onDataChange(
        data.map((item) =>
          item.id === activeId ? { ...item, column: startColumn } : item,
        ),
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const startColumn = dragStartColumnRef.current;
    const trackedColumn = dragCurrentColumnRef.current;
    setActiveCardId(null);
    dragStartColumnRef.current = null;
    dragCurrentColumnRef.current = null;

    // Soltou fora de qualquer coluna → reverte para a origem.
    if (!over) {
      if (onDataChange && startColumn) {
        onDataChange(
          data.map((item) =>
            item.id === String(active.id)
              ? { ...item, column: startColumn }
              : item,
          ),
        );
      }
      return;
    }

    // Reordenamento de colunas.
    if (active.data.current?.type === "column") {
      const overId = String(over.id);
      const overColumnId =
        resolveColumn(overId) ??
        (columns.some((candidate) => candidate.id === overId) ? overId : null) ??
        (overId === "__add_column__" ? "__add_column__" : null);

      if (!overColumnId || overColumnId === String(active.id)) return;

      const activeColumn = columns.find(
        (candidate) => candidate.id === String(active.id),
      );
      // Colunas fixas (ex.: Agendada/Perdida) nunca iniciam reorder.
      if (
        activeColumn &&
        isColumnSortable &&
        !isColumnSortable(activeColumn)
      ) {
        return;
      }

      onColumnReorder?.(String(active.id), overColumnId);
      return;
    }

    const item = data.find((candidate) => candidate.id === active.id);
    if (!item) return;

    // Destino: over → coluna rastreada no dragOver → coluna atual do item.
    const toColumn =
      resolveColumn(String(over.id)) ?? trackedColumn ?? item.column;

    // Modo controlado (com onDataChange): preview já veio do onDragOver;
    // aqui só reordenamos dentro da coluna e disparamos persistência.
    if (onDataChange) {
      let nextData = data;
      if (toColumn && toColumn !== item.column) {
        nextData = data.map((candidate) =>
          candidate.id === active.id
            ? { ...candidate, column: toColumn }
            : candidate,
        );
        onDataChange(nextData);
      } else if (active.id !== over.id) {
        const oldIndex = data.findIndex((c) => c.id === active.id);
        const newIndex = data.findIndex((c) => c.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          nextData = arrayMove(data, oldIndex, newIndex);
          onDataChange(nextData);
        }
      }
      onCardDrop?.(nextData, {
        cardId: String(active.id),
        fromColumn: startColumn,
        toColumn: toColumn ?? item.column,
      });
      if (startColumn && toColumn && toColumn !== startColumn) {
        onColumnChange?.(String(active.id), toColumn, startColumn);
      }
      return;
    }

    // Modo não-controlado (sem onDataChange): comportamento original.
    if (!toColumn || toColumn === startColumn) return;
    onColumnChange?.(String(active.id), toColumn, startColumn ?? item.column);
    onCardDrop?.(
      data.map((candidate) =>
        candidate.id === active.id
          ? { ...candidate, column: toColumn }
          : candidate,
      ),
      {
        cardId: String(active.id),
        fromColumn: startColumn,
        toColumn,
      },
    );
  };

  const columnName = (columnId?: string) =>
    columns.find((column) => column.id === columnId)?.name ?? columnId ?? "";

  const announcements: Announcements = {
    onDragStart({ active }) {
      const item = data.find((candidate) => candidate.id === active.id);
      return `Card movido a partir da coluna "${columnName(item?.column)}".`;
    },
    onDragOver({ over }) {
      const target = over ? resolveColumn(String(over.id)) : null;
      return target ? `Sobre a coluna "${columnName(target)}".` : "";
    },
    onDragEnd({ over }) {
      const target = over ? resolveColumn(String(over.id)) : null;
      return target
        ? `Card solto na coluna "${columnName(target)}".`
        : "Card devolvido à coluna de origem.";
    },
    onDragCancel() {
      return "Movimentação cancelada.";
    },
  };

  return (
    <KanbanContext.Provider value={{ data, activeCardId }}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{ announcements }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <Box
          className={cn("relative", className)}
          sx={{ overflowX: "auto", overflowY: "hidden", width: "100%", height: "100%" }}
        >
          <Box sx={{ display: "flex", height: "100%", width: "max-content", gap: 2, pb: 1.5 }}>
            {onColumnReorder ? (
              <SortableContext
                items={sortableColumnIds}
                strategy={horizontalListSortingStrategy}
              >
                {columns.map((column) => children(column))}
              </SortableContext>
            ) : (
              columns.map((column) => children(column))
            )}
          </Box>
        </Box>
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeItem && renderOverlay ? renderOverlay(activeItem as T) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </KanbanContext.Provider>
  );
}
