'use client';

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
} from '@dnd-kit/core';
import type { DraggableAttributes } from '@dnd-kit/core';
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  cloneElement,
  createContext,
  Fragment,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { SCROLL_CLASS } from '@/lib/scroll';
import { useHorizontalBoardPan } from './use-horizontal-board-pan';

export type KanbanItem = {
  id: string;
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
  listeners?: ReturnType<typeof useSortable>['listeners'];
  setActivatorNodeRef?: (node: HTMLElement | null) => void;
};

const KanbanColumnDndContext = createContext<KanbanColumnDndValue>({
  sortable: false,
});

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
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
    data: { type: 'column' },
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
          'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-muted/20 ring-2 transition-colors',
          // Snap só no mobile (carousel); no desktop colunas flex sem snap.
          'snap-start md:snap-align-none',
          isOver ? 'ring-primary/40' : 'ring-transparent',
          isDragging && 'z-10 opacity-70',
          className,
        )}
      >
        {children}
      </div>
    </KanbanColumnDndContext.Provider>
  );
}

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
        'flex cursor-grab touch-none items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing',
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
        'flex items-center gap-2 border-b border-border/50 px-4 py-3',
        className,
      )}
      {...props}
    />
  );
}

export type KanbanCardsProps<T extends KanbanItem = KanbanItem> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'id'
> & {
  id: string;
  children: (item: T) => ReactNode;
  emptyState?: ReactNode;
  viewportClassName?: string;
  viewportStyle?: CSSProperties;
};

export function KanbanCards<T extends KanbanItem = KanbanItem>({
  id,
  children,
  className,
  viewportClassName,
  viewportStyle,
  emptyState,
  ...props
}: KanbanCardsProps<T>) {
  const { data } = useContext(KanbanContext);
  const items = useMemo(() => {
    const filtered = data.filter((item) => item.column === id) as T[];
    const seen = new Set<string>();
    const unique: T[] = [];
    for (const item of filtered) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      unique.push(item);
    }
    return unique;
  }, [data, id]);
  const ids = useMemo(() => items.map((item) => item.id), [items]);

  return (
    <div
      className={cn(
        SCROLL_CLASS,
        // Scroll vertical por coluna (kanban); pan mobile via useHorizontalBoardPan.
        'min-h-0 flex-1 overflow-y-auto overscroll-y-contain',
        'max-md:[touch-action:none] md:touch-pan-y',
        viewportClassName,
      )}
      style={viewportStyle}
      data-kanban-column-scroll=""
    >
      <SortableContext items={ids}>
        <div className={cn('flex flex-col gap-3 p-3', className)} {...props}>
          {items.length > 0
            ? items.map((item) => {
                const node = children(item);
                // key no elemento raiz sortable (sem wrapper extra que quebra o layout do dnd)
                if (isValidElement(node)) {
                  return cloneElement(node, { key: `${id}:${item.id}` });
                }
                return (
                  <Fragment key={`${id}:${item.id}`}>{node}</Fragment>
                );
              })
            : emptyState}
        </div>
      </SortableContext>
    </div>
  );
}

export type KanbanCardProps = {
  id: string;
  children: ReactNode;
  className?: string;
  /**
   * Quando `true`, só a alça (`.kanban-card-handle`) inicia o drag.
   * Default: `true` em viewports estreitas (≤767px) — inclui DevTools “mobile”.
   */
  dragHandleOnly?: boolean;
};

/** Viewports de smartphone / DevTools mobile (breakpoint `sm` = 640; usamos 768). */
const NARROW_VIEWPORT_MQ = '(max-width: 767px)';

function subscribeNarrowViewport(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(NARROW_VIEWPORT_MQ);
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

function getNarrowViewportSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(NARROW_VIEWPORT_MQ).matches;
}

function usePrefersDragHandle(): boolean {
  // Viewport estreito (não pointer:coarse): emulação de celular no desktop
  // reporta pointer:fine, mas o dedo/gesto precisa da alça + pan do board.
  return useSyncExternalStore(
    subscribeNarrowViewport,
    getNarrowViewportSnapshot,
    () => false,
  );
}

export function KanbanCard({
  id,
  children,
  className,
  dragHandleOnly: dragHandleOnlyProp,
}: KanbanCardProps) {
  const prefersHandle = usePrefersDragHandle();
  const dragHandleOnly = dragHandleOnlyProp ?? prefersHandle;

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: 'card' } });

  const style: CSSProperties = {
    // Fonte some no drag: a preview fica só no DragOverlay (evita “ghost” duplo).
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0 : undefined,
    // No mobile (alça): touch-action none no card → o browser não “rouba” o gesto;
    // o useHorizontalBoardPan define scroll X/Y. Alça tem listeners dnd separados.
    touchAction: isDragging || dragHandleOnly ? 'none' : 'manipulation',
  };

  const activatorProps = dragHandleOnly
    ? undefined
    : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        !dragHandleOnly && 'cursor-grab active:cursor-grabbing',
        'relative select-none',
        isDragging && 'pointer-events-none',
        className,
      )}
      data-kanban-drag-handle-only={dragHandleOnly ? 'true' : 'false'}
      {...activatorProps}
    >
      {dragHandleOnly ? (
        <button
          type="button"
          ref={setActivatorNodeRef}
          data-kanban-drag-handle
          className={cn(
            'kanban-card-handle absolute right-1.5 top-1.5 z-10',
            'flex h-9 w-9 cursor-grab items-center justify-center rounded-full',
            'bg-background/95 text-muted-foreground shadow-sm ring-1 ring-border/60',
            'touch-none active:cursor-grabbing',
          )}
          aria-label="Arrastar card"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden className="grid grid-cols-2 gap-0.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="size-1 rounded-full bg-current opacity-70"
              />
            ))}
          </span>
        </button>
      ) : null}
      {children}
    </div>
  );
}

export type KanbanLayout = 'scroll' | 'fill';

export type KanbanProviderProps<
  T extends KanbanItem = KanbanItem,
  C extends KanbanColumn = KanbanColumn,
> = {
  columns: C[];
  data: T[];
  children: (column: C) => ReactNode;
  className?: string;
  id?: string;
  layout?: KanbanLayout;
  onColumnChange?: (cardId: string, toColumn: string, fromColumn: string) => void;
  onDataChange?: (data: T[]) => void;
  onCardDrop?: (
    data: T[],
    meta: { cardId: string; fromColumn: string | null; toColumn: string },
  ) => void;
  /** Quando retorna false, o card não muda de coluna (dragOver/drop). */
  canMoveCard?: (
    item: T,
    meta: { fromColumn: string; toColumn: string },
  ) => boolean;
  renderOverlay?: (item: T) => ReactNode;
  onColumnReorder?: (activeColumnId: string, overColumnId: string) => void;
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
  id: idProp,
  layout = 'scroll',
  onColumnChange,
  onDataChange,
  onCardDrop,
  canMoveCard,
  renderOverlay,
  onColumnReorder,
  isColumnSortable,
}: KanbanProviderProps<T, C>) {
  const reactId = useId();
  const dndContextId = idProp ?? reactId;
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [overlayMounted, setOverlayMounted] = useState(false);
  useEffect(() => {
    setOverlayMounted(true);
  }, []);
  const dragStartColumnRef = useRef<string | null>(null);
  const dragCurrentColumnRef = useRef<string | null>(null);
  const [boardScroller, setBoardScroller] = useState<HTMLDivElement | null>(
    null,
  );
  const activeCardIdRef = useRef<string | null>(null);
  activeCardIdRef.current = activeCardId;

  const isBoardPanBlocked = useCallback(
    () => activeCardIdRef.current != null,
    [],
  );

  useHorizontalBoardPan(boardScroller, {
    enabled: layout === 'scroll',
    isBlocked: isBoardPanBlocked,
  });

  const sortableColumnIds = useMemo(
    () =>
      onColumnReorder
        ? columns
            .filter(
              (column) =>
                !(
                  'isAddColumn' in column &&
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
      // Só a alça tem listeners no mobile — delay curto para não lutar com pan.
      activationConstraint: { delay: 180, tolerance: 10 },
    }),
    useSensor(KeyboardSensor),
  );

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
    if (
      column &&
      !('isAddColumn' in column && (column as { isAddColumn?: boolean }).isAddColumn)
    ) {
      return overId;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'column') return;
    const card = data.find((item) => item.id === event.active.id);
    dragStartColumnRef.current = card?.column ?? null;
    dragCurrentColumnRef.current = card?.column ?? null;
    setActiveCardId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!onDataChange) return;
    if (event.active.data.current?.type === 'column') return;

    const { active, over } = event;
    if (!over) return;

    const activeItem = data.find((item) => item.id === active.id);
    if (!activeItem) return;

    const overColumn = resolveColumn(String(over.id));
    if (!overColumn || overColumn === activeItem.column) return;

    if (
      canMoveCard &&
      !canMoveCard(activeItem as T, {
        fromColumn: activeItem.column,
        toColumn: overColumn,
      })
    ) {
      return;
    }

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

    if (active.data.current?.type === 'column') {
      const overId = String(over.id);
      const overColumnId =
        resolveColumn(overId) ??
        (columns.some((candidate) => candidate.id === overId) ? overId : null) ??
        (overId === '__add_column__' ? '__add_column__' : null);

      if (!overColumnId || overColumnId === String(active.id)) return;

      const activeColumn = columns.find(
        (candidate) => candidate.id === String(active.id),
      );
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

    const fromColumn = startColumn ?? item.column;
    const toColumn =
      resolveColumn(String(over.id)) ?? trackedColumn ?? item.column;

    const columnChanged = Boolean(toColumn && toColumn !== fromColumn);
    const moveAllowed =
      !columnChanged ||
      !canMoveCard ||
      canMoveCard(item as T, { fromColumn, toColumn });

    if (columnChanged && !moveAllowed) {
      if (onDataChange) {
        onDataChange(
          data.map((candidate) =>
            candidate.id === active.id
              ? { ...candidate, column: fromColumn }
              : candidate,
          ),
        );
      }
      onCardDrop?.(
        data.map((candidate) =>
          candidate.id === active.id
            ? { ...candidate, column: fromColumn }
            : candidate,
        ),
        {
          cardId: String(active.id),
          fromColumn,
          toColumn,
        },
      );
      return;
    }

    if (onDataChange) {
      let nextData = data;
      if (columnChanged) {
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
      if (columnChanged && startColumn && toColumn !== startColumn) {
        onColumnChange?.(String(active.id), toColumn, startColumn);
      }
      return;
    }

    if (!columnChanged || !moveAllowed) return;
    onColumnChange?.(String(active.id), toColumn, fromColumn);
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
    columns.find((column) => column.id === columnId)?.name ?? columnId ?? '';

  const announcements: Announcements = {
    onDragStart({ active }) {
      const item = data.find((candidate) => candidate.id === active.id);
      return `Card movido a partir da coluna "${columnName(item?.column)}".`;
    },
    onDragOver({ over }) {
      const target = over ? resolveColumn(String(over.id)) : null;
      return target ? `Sobre a coluna "${columnName(target)}".` : '';
    },
    onDragEnd({ over }) {
      const target = over ? resolveColumn(String(over.id)) : null;
      return target
        ? `Card solto na coluna "${columnName(target)}".`
        : 'Card devolvido à coluna de origem.';
    },
    onDragCancel() {
      return 'Movimentação cancelada.';
    },
  };

  return (
    <KanbanContext.Provider value={{ data, activeCardId }}>
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={collisionDetection}
        accessibility={{ announcements }}
        autoScroll={false}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div
          className={cn(
            'relative w-full min-w-0 max-w-full overflow-visible',
            className,
          )}
        >
          <div
            ref={setBoardScroller}
            data-kanban-board-scroll=""
            className={cn(
              'w-full min-w-0 max-w-full',
              layout === 'scroll'
                ? [
                    // Só pan horizontal no mobile; vertical fica na página.
                    'overflow-x-auto overflow-y-visible overscroll-x-contain md:overflow-x-hidden',
                    '[scrollbar-width:thin] [-webkit-overflow-scrolling:touch]',
                    'snap-x snap-mandatory md:snap-none',
                    // Vertical: browser (página); horizontal: useHorizontalBoardPan.
                    '[touch-action:pan-y] md:touch-auto',
                  ].join(' ')
                : 'overflow-visible',
            )}
            style={
              layout === 'scroll'
                ? {
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorX: 'contain',
                  }
                : undefined
            }
          >
            <div
              className={cn(
                'flex gap-3 pb-3',
                layout === 'fill'
                  ? 'h-auto min-h-full w-full min-w-0 flex-wrap content-start lg:h-full lg:flex-nowrap'
                  : // Altura limitada: cada coluna rola internamente.
                    'h-[min(36rem,calc(100dvh-14rem))] items-stretch gap-2 px-0.5 sm:gap-3 md:w-full md:min-w-0 md:gap-3 md:px-0 w-max min-w-max',
              )}
            >
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
            </div>
          </div>
        </div>
        {overlayMounted
          ? createPortal(
              <DragOverlay dropAnimation={null}>
                {activeItem && renderOverlay
                  ? renderOverlay(activeItem as T)
                  : null}
              </DragOverlay>,
              document.body,
            )
          : null}
      </DndContext>
    </KanbanContext.Provider>
  );
}
