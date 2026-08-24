"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { canViewSalesFunnel } from "@citybox/clinica-permissions";

import { Skeleton } from "@citybox/ui/atoms";

import { useDebounce } from "../lib/use-debounce";
import { useCurrentUser } from "../lib/current-user";
import type { Funnel, KanbanColumn, KanbanCard, PeriodFilter } from "../types";
import { HeaderBoard } from "./header-board";
import { SalesKanbanBoard } from "./kanban-board";
import { OpportunitySheet, type OpportunityFormData } from "./opportunity-sheet";
import { OpportunityDetailSheet } from "./opportunity-detail-sheet";
import type { OpportunityFilters } from "./filter-popover";
import { useFunnels } from "../hooks/use-funnels";
import { useCreateFunnel } from "../hooks/use-create-funnel";
import { useUpdateFunnel } from "../hooks/use-update-funnel";
import { useEnsureDefaultFunnels } from "../hooks/use-ensure-default-funnels";
import { useOpportunities } from "../hooks/use-opportunities";
import { useCreateOpportunity } from "../hooks/use-create-opportunity";
import { useMoveOpportunity } from "../hooks/use-move-opportunity";
import { useReorderOpportunities } from "../hooks/use-reorder-opportunities";
import { useDeleteOpportunity } from "../hooks/use-delete-opportunity";
import { useUpdateOpportunity } from "../hooks/use-update-opportunity";
import { useLabels } from "../hooks/use-labels";
import { useSalesPermissions } from "../hooks/use-sales-permissions";
import type {
  Funnel as ApiFunnel,
  Opportunity as ApiOpportunity,
} from "../services/sales.service";

/** Referência estável — evitar `data = []` no destructuring (novo array a cada render). */
const EMPTY_LABELS: Array<{ id: string; name: string; color: string }> = [];
const EMPTY_CARDS: KanbanCard[] = [];
const EMPTY_COLUMNS: KanbanColumn[] = [];

// Mapeia stage da API para KanbanColumn.
function mapStageToColumn(stage: ApiFunnel["stages"][number]): KanbanColumn {
  const typeMap: Record<string, KanbanColumn["type"]> = {
    others: "open",
    won: "completed",
    lost: "lost",
  };
  const columnType: KanbanColumn["type"] = typeMap[stage.type] ?? "open";

  return {
    id: stage.id,
    name: stage.name,
    type: columnType,
    order: stage.order,
    isEditable: stage.type === "others",
    isDraggable: stage.type === "others",
    color: stage.color,
  };
}

function mapApiFunnelToFunnel(apiFunnel: ApiFunnel): Funnel {
  const wonStage = apiFunnel.stages.find((s) => s.type === "won");
  return {
    id: apiFunnel.id,
    name: apiFunnel.name,
    isDefault: apiFunnel.isDefault,
    completedColumnName: wonStage?.name || "Concluída",
    columns: apiFunnel.stages.map(mapStageToColumn),
  };
}

function mapOpportunityToCard(
  opportunity: ApiOpportunity,
  labels: Array<{ id: string; name: string; color: string }>,
): KanbanCard {
  const label = opportunity.labelId
    ? labels.find((l) => l.id === opportunity.labelId)
    : undefined;

  return {
    id: opportunity.id,
    title: opportunity.title,
    columnId: opportunity.stageId,
    patientId: opportunity.patientId,
    patientName: opportunity.patient?.name,
    phone: opportunity.phone,
    origin: opportunity.origin,
    description: opportunity.description,
    nextContact: opportunity.nextContact
      ? new Date(opportunity.nextContact)
      : undefined,
    lastInteraction: opportunity.lastInteraction
      ? new Date(opportunity.lastInteraction)
      : undefined,
    submissionId: opportunity.submissionId,
    budgetId: opportunity.budgetId,
    campaignId: opportunity.campaign?.id,
    campaignName: opportunity.campaign?.name,
    label: label
      ? { id: label.id, name: label.name, color: label.color }
      : undefined,
    sortOrder: opportunity.sortOrder ?? 0,
    createdAt: new Date(opportunity.createdAt),
  };
}

/** Itens de reorder a partir da ordem visual dos cards (por coluna). */
function buildReorderItems(
  cards: KanbanCard[],
  columnIds: string[],
): Array<{ id: string; stageId: string; sortOrder: number }> {
  const items: Array<{ id: string; stageId: string; sortOrder: number }> = [];
  for (const columnId of columnIds) {
    const inColumn = cards.filter((card) => card.columnId === columnId);
    inColumn.forEach((card, index) => {
      items.push({ id: card.id, stageId: columnId, sortOrder: index });
    });
  }
  return items;
}

export function SalesBoard() {
  const { canManageOpportunities, canViewAnyFunnel, clinicPermissions } =
    useSalesPermissions();
  const { data: apiFunnels, isLoading: isLoadingFunnels } = useFunnels();
  const ensureDefaultFunnels = useEnsureDefaultFunnels();
  const createFunnel = useCreateFunnel();
  const updateFunnel = useUpdateFunnel();
  const createOpportunity = useCreateOpportunity();
  const moveOpportunity = useMoveOpportunity();
  const reorderOpportunities = useReorderOpportunities();
  const deleteOpportunity = useDeleteOpportunity();
  const updateOpportunity = useUpdateOpportunity();

  const currentUser = useCurrentUser();

  const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");
  const [isOpportunitySheetOpen, setIsOpportunitySheetOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [filters, setFilters] = useState<OpportunityFilters>({});
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("this_month");
  const [periodStartDate, setPeriodStartDate] = useState<Date | undefined>();
  const [periodEndDate, setPeriodEndDate] = useState<Date | undefined>();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (isLoadingFunnels || !apiFunnels) return;
    // Lista vazia por falta de checkbox ≠ loja sem funis padrão.
    if (!canViewAnyFunnel && !canManageOpportunities) return;
    const hasDefaultFunnels = apiFunnels.some((f) => f.isDefault);
    if (!hasDefaultFunnels) {
      ensureDefaultFunnels.mutate(undefined, {
        onError: (error) =>
          toast.error(
            error.message ||
              "Erro ao criar funis padrão. Recarregue a página.",
          ),
      });
    }
    // mutate é estável; omitir o objeto da mutation das deps evita re-disparos.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only bootstrap when funnels load
  }, [
    isLoadingFunnels,
    apiFunnels,
    canViewAnyFunnel,
    canManageOpportunities,
  ]);

  const funnels = useMemo(
    () =>
      apiFunnels
        ? apiFunnels
            .filter((funnel) =>
              canViewSalesFunnel(funnel, clinicPermissions),
            )
            .map(mapApiFunnelToFunnel)
        : [],
    [apiFunnels, clinicPermissions],
  );

  useEffect(() => {
    if (funnels.length === 0) {
      if (selectedFunnelId) setSelectedFunnelId("");
      return;
    }
    if (
      !selectedFunnelId ||
      !funnels.some((funnel) => funnel.id === selectedFunnelId)
    ) {
      setSelectedFunnelId(funnels[0].id);
    }
  }, [funnels, selectedFunnelId]);

  const opportunityFilters = useMemo(() => {
    if (!selectedFunnelId) return undefined;
    return {
      funnelId: selectedFunnelId,
      period: periodFilter,
      startDate: periodFilter === "custom" ? periodStartDate : undefined,
      endDate: periodFilter === "custom" ? periodEndDate : undefined,
      labelId:
        filters.labelId && filters.labelId !== "all"
          ? filters.labelId
          : undefined,
      origin:
        filters.origin && filters.origin !== "all" ? filters.origin : undefined,
      stageId:
        filters.columnId && filters.columnId !== "all"
          ? filters.columnId
          : undefined,
      nextContactDate: filters.nextContactDate,
      search: debouncedSearchQuery || undefined,
    };
  }, [
    selectedFunnelId,
    periodFilter,
    periodStartDate,
    periodEndDate,
    filters,
    debouncedSearchQuery,
  ]);

  const { data: apiOpportunities, isLoading: isLoadingOpportunities } =
    useOpportunities(opportunityFilters);

  const { data: labelsData } = useLabels();
  const labels = labelsData ?? EMPTY_LABELS;

  const selectedFunnel = useMemo(
    () => funnels.find((f) => f.id === selectedFunnelId),
    [funnels, selectedFunnelId],
  );

  const handleCreateFunnel = useCallback(
    (name: string) => {
      createFunnel.mutate(
        { name },
        {
          onSuccess: (newFunnel) => {
            setSelectedFunnelId(newFunnel.id);
            toast.success("Funil criado com sucesso!");
          },
          onError: (error) => toast.error(error.message || "Erro ao criar funil"),
        },
      );
    },
    [createFunnel],
  );

  const handleUpdateFunnel = useCallback(
    (id: string, name: string) => {
      updateFunnel.mutate(
        { id, data: { name } },
        {
          onSuccess: () => toast.success("Funil atualizado com sucesso!"),
          onError: (error) =>
            toast.error(error.message || "Erro ao atualizar funil"),
        },
      );
    },
    [updateFunnel],
  );

  const handleFilter = useCallback(
    (filterData: {
      funnelId: string;
      period: PeriodFilter;
      search: string;
      startDate?: Date;
      endDate?: Date;
    }) => {
      setPeriodFilter(filterData.period);
      setPeriodStartDate(filterData.startDate);
      setPeriodEndDate(filterData.endDate);
      setSearchQuery(filterData.search);
    },
    [],
  );

  const handleOpportunitySubmit = useCallback(
    (data: OpportunityFormData) => {
      if (!selectedFunnelId || !selectedFunnel) return;

      const firstColumn = [...selectedFunnel.columns].sort(
        (a, b) => a.order - b.order,
      )[0];
      if (!firstColumn) return;

      createOpportunity.mutate(
        {
          funnelId: selectedFunnelId,
          stageId: firstColumn.id,
          title: data.title,
          description: data.description,
          phone: data.phone,
          origin: data.origin,
          nextContact: data.nextContact,
          patientId: data.patientId,
          labelId: data.labelId,
        },
        {
          onSuccess: () => {
            toast.success("Oportunidade criada com sucesso!");
            setIsOpportunitySheetOpen(false);
          },
          onError: (error) =>
            toast.error(error.message || "Erro ao criar oportunidade"),
        },
      );
    },
    [selectedFunnelId, selectedFunnel, createOpportunity],
  );

  const funnelCards = useMemo(() => {
    if (!selectedFunnel || !apiOpportunities) return EMPTY_CARDS;
    return apiOpportunities
      .map((opp) => mapOpportunityToCard(opp, labels))
      .sort((a, b) => {
        if (a.columnId !== b.columnId) return a.columnId.localeCompare(b.columnId);
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }, [selectedFunnel, apiOpportunities, labels]);

  // Estado local otimista: o kanban move cards/colunas ao vivo durante o arraste
  // (sem "snapback"); a persistência via mutation acontece em paralelo.
  const [localCards, setLocalCards] = useState<KanbanCard[]>(EMPTY_CARDS);
  const [localColumns, setLocalColumns] =
    useState<KanbanColumn[]>(EMPTY_COLUMNS);

  // Snapshot do servidor para reverter em erro (evita closure stale / TDZ).
  const funnelCardsRef = useRef(funnelCards);
  funnelCardsRef.current = funnelCards;

  const isPersistingCards =
    moveOpportunity.isPending || reorderOpportunities.isPending;

  // Sincroniza o estado local com o servidor, sem sobrescrever move/reorder em andamento.
  useEffect(() => {
    if (isPersistingCards) return;
    setLocalCards(funnelCards);
  }, [funnelCards, isPersistingCards]);

  useEffect(() => {
    setLocalColumns(selectedFunnel?.columns ?? EMPTY_COLUMNS);
  }, [selectedFunnel]);

  const persistColumnOrder = useCallback(
    (cards: KanbanCard[], columnIds: string[]) => {
      const items = buildReorderItems(cards, columnIds);
      if (items.length === 0) return;

      const previousById = new Map(
        funnelCardsRef.current.map((card) => [card.id, card]),
      );
      const changedVsServer = items.some((item) => {
        const prev = previousById.get(item.id);
        return (
          !prev ||
          prev.columnId !== item.stageId ||
          prev.sortOrder !== item.sortOrder
        );
      });
      if (!changedVsServer) return;

      setLocalCards(
        cards.map((card) => {
          const item = items.find((entry) => entry.id === card.id);
          return item
            ? { ...card, columnId: item.stageId, sortOrder: item.sortOrder }
            : card;
        }),
      );
      reorderOpportunities.mutate(items, {
        onError: (error) => {
          setLocalCards(funnelCardsRef.current);
          toast.error(error.message || "Erro ao reordenar oportunidades");
        },
      });
    },
    [reorderOpportunities],
  );

  const handleReorderInColumn = useCallback(
    (cards: KanbanCard[], columnId: string) => {
      persistColumnOrder(cards, [columnId]);
    },
    [persistColumnOrder],
  );

  const handleMove = useCallback(
    (
      cardId: string,
      stageId: string,
      orderedCards: KanbanCard[],
      fromColumnId?: string | null,
    ) => {
      const cardsWithMove = orderedCards.map((card) =>
        card.id === cardId ? { ...card, columnId: stageId } : card,
      );
      const destCards = cardsWithMove.filter((card) => card.columnId === stageId);
      const sortOrder = destCards.findIndex((card) => card.id === cardId);
      const previousColumnId =
        fromColumnId ??
        funnelCardsRef.current.find((c) => c.id === cardId)?.columnId;

      setLocalCards(cardsWithMove);

      moveOpportunity.mutate(
        {
          id: cardId,
          stageId,
          sortOrder: sortOrder >= 0 ? sortOrder : undefined,
        },
        {
          onSuccess: () => {
            const columnIds = [
              stageId,
              ...(previousColumnId && previousColumnId !== stageId
                ? [previousColumnId]
                : []),
            ];
            persistColumnOrder(cardsWithMove, columnIds);
          },
          onError: (error) => {
            setLocalCards(funnelCardsRef.current);
            toast.error(error.message || "Erro ao mover oportunidade");
          },
        },
      );
    },
    [moveOpportunity, persistColumnOrder],
  );

  const handleStatusChange = useCallback(
    (cardId: string, columnId: string) => {
      const fromColumnId = localCards.find((c) => c.id === cardId)?.columnId;
      const orderedCards = localCards.map((card) =>
        card.id === cardId ? { ...card, columnId } : card,
      );
      handleMove(cardId, columnId, orderedCards, fromColumnId);
      setSelectedCard((prev) =>
        prev?.id === cardId ? { ...prev, columnId } : prev,
      );
    },
    [localCards, handleMove],
  );

  const handleLabelChange = useCallback(
    (cardId: string, labelId: string) => {
      updateOpportunity.mutate(
        { id: cardId, data: { labelId: labelId || undefined } },
        {
          onSuccess: () => {
            const label = labels.find((l) => l.id === labelId);
            setSelectedCard((prev) => {
              if (prev?.id !== cardId) return prev;
              return {
                ...prev,
                label: label
                  ? { id: label.id, name: label.name, color: label.color }
                  : undefined,
              };
            });
          },
          onError: (error) =>
            toast.error(error.message || "Erro ao atualizar etiqueta"),
        },
      );
    },
    [updateOpportunity, labels],
  );

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      deleteOpportunity.mutate(cardId, {
        onSuccess: () => {
          toast.success("Oportunidade excluída com sucesso!");
          setSelectedCard(null);
        },
        onError: (error) =>
          toast.error(error.message || "Erro ao excluir oportunidade"),
      });
    },
    [deleteOpportunity],
  );

  // Reordena/edita colunas de forma otimista (local) e persiste em paralelo.
  const handleColumnsChangeOptimistic = useCallback(
    (newColumns: KanbanColumn[]) => {
      const previous = localColumns;
      setLocalColumns(newColumns);
      if (!selectedFunnelId) return;
      const apiFunnel = apiFunnels?.find((f) => f.id === selectedFunnelId);
      if (!apiFunnel) return;

      const sorted = [...newColumns].sort((a, b) => a.order - b.order);
      const movable = sorted.filter(
        (col) => col.type !== "completed" && col.type !== "lost",
      );
      const won = sorted.find((col) => col.type === "completed");
      const lost = sorted.find((col) => col.type === "lost");
      const pinnedColumns = [
        ...movable.map((col, index) => ({ ...col, order: index })),
        ...(won ? [{ ...won, order: 998 }] : []),
        ...(lost ? [{ ...lost, order: 999 }] : []),
      ];

      const stages = pinnedColumns.map((col) => {
        const existingApiStage = apiFunnel.stages.find((s) => s.id === col.id);
        if (!existingApiStage) {
          return {
            name: col.name,
            type: "others" as const,
            color: col.color || "#94a3b8",
            order: col.order,
          };
        }
        return {
          id: col.id,
          name: col.name,
          type: existingApiStage.type,
          color: col.color || existingApiStage.color,
          order: col.order,
        };
      });

      updateFunnel.mutate(
        { id: selectedFunnelId, data: { stages } },
        {
          onError: (error) => {
            setLocalColumns(previous);
            toast.error(error.message || "Erro ao atualizar etapas");
          },
        },
      );
    },
    [localColumns, selectedFunnelId, apiFunnels, updateFunnel],
  );

  if (isLoadingFunnels) {
    return <SalesBoardSkeleton />;
  }

  if (!selectedFunnel) {
    return <div>Nenhum funil selecionado</div>;
  }

  return (
    <>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <HeaderBoard
          funnels={funnels}
          selectedFunnelId={selectedFunnelId}
          columns={selectedFunnel.columns}
          filters={filters}
          periodFilter={periodFilter}
          periodStartDate={periodStartDate}
          periodEndDate={periodEndDate}
          searchQuery={searchQuery}
          onFunnelChange={setSelectedFunnelId}
          onCreateFunnel={handleCreateFunnel}
          onUpdateFunnel={handleUpdateFunnel}
          onFiltersChange={setFilters}
          onFilter={handleFilter}
          onSearchChange={setSearchQuery}
          onCreateOpportunity={() => setIsOpportunitySheetOpen(true)}
          canCreateOpportunity={canManageOpportunities}
        />

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {isLoadingOpportunities && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  Carregando oportunidades...
                </p>
              </div>
            </div>
          )}
          <SalesKanbanBoard
            funnel={{ ...selectedFunnel, columns: localColumns }}
            cards={localCards}
            canManage={canManageOpportunities}
            onColumnsChange={handleColumnsChangeOptimistic}
            onCardsChange={setLocalCards}
            onMoveRevert={() => setLocalCards(funnelCardsRef.current)}
            onCardClick={setSelectedCard}
            onMove={handleMove}
            onReorder={handleReorderInColumn}
            isMoving={isPersistingCards}
          />
        </div>
      </div>

      {canManageOpportunities ? (
        <OpportunitySheet
          open={isOpportunitySheetOpen}
          onOpenChange={setIsOpportunitySheetOpen}
          onSubmit={handleOpportunitySubmit}
        />
      ) : null}

      <OpportunityDetailSheet
        open={!!selectedCard}
        onOpenChange={(open) => !open && setSelectedCard(null)}
        card={selectedCard}
        canManage={canManageOpportunities}
        columns={selectedFunnel.columns}
        currentUser={currentUser}
        onStatusChange={handleStatusChange}
        onLabelChange={handleLabelChange}
        onDelete={handleDeleteCard}
      />
    </>
  );
}

function SalesBoardSkeleton() {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-col items-start gap-3 py-4 lg:flex-row lg:justify-between lg:gap-4">
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <Skeleton className="h-10 w-60" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="flex h-full gap-4 px-1 pb-4">
          {[1, 2, 3, 4].map((col) => (
            <div
              key={col}
              className="flex w-72 flex-col rounded-2xl border bg-muted/20"
            >
              <div className="flex items-center gap-2 border-b p-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
              <div className="flex-1 space-y-2 p-3">
                {[1, 2, 3].map((c) => (
                  <Skeleton key={c} className="h-24 w-full rounded-md" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
