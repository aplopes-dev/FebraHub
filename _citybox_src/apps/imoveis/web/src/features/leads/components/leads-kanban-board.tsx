'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '@citybox/mui/molecules';
import { Box, Button, Typography } from '@citybox/mui/atoms';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type KanbanColumn,
  type KanbanItem,
} from '@/components/kanban';
import {
  listifyPrimary,
  listifySky,
  listifySuccess,
  listifyWarning,
} from '@/theme/tokens';
import { getLeadById } from '../services/leads-service';
import { ImoveisApiError } from '@/lib/imoveis-api';
import { useUpdateDealStageMutation } from '../hooks/use-deals-queries';
import type { KanbanDealsColumnState } from '../hooks/use-kanban-deals-queries';
import {
  DEAL_KANBAN_STAGES,
  DEAL_STAGE_LABEL,
  type ContactLeadDetail,
  type DealDetail,
  type DealStage,
} from '../types';
import { LeadsKanbanCard } from './leads-kanban-card';
import { dealHasSelectedProperty } from '../utils/lead-pipeline';

export { KANBAN_COLUMN_PAGE_SIZE } from '../hooks/use-kanban-deals-queries';

type DealKanbanItem = KanbanItem & {
  column: DealStage;
  deal: DealDetail;
};

type DealKanbanColumn = KanbanColumn & {
  id: DealStage;
  name: string;
};

const COLUMNS: DealKanbanColumn[] = DEAL_KANBAN_STAGES.map((stage) => ({
  id: stage,
  name: DEAL_STAGE_LABEL[stage],
}));

const COLUMN_DOT: Record<DealStage, string> = {
  awaiting_property: listifySky[100],
  property_selected: listifyPrimary[300],
  contract_sent: listifyWarning[100],
  contract_signed: listifyPrimary[200],
  payment_confirmed: listifySuccess[200],
  handover: listifySuccess[100],
};

function toKanbanItems(deals: readonly DealDetail[]): DealKanbanItem[] {
  const byId = new Map<string, DealKanbanItem>();
  for (const deal of deals) {
    byId.set(deal.id, {
      id: deal.id,
      column: deal.stage,
      deal,
    });
  }
  return Array.from(byId.values());
}

/** Reconcilia API com estado local: não puxa de volta cards com move pendente. */
function mergeDealsIntoItems(
  current: readonly DealKanbanItem[],
  deals: readonly DealDetail[],
  pendingMoveIds: ReadonlySet<string>,
): DealKanbanItem[] {
  const fromApi = toKanbanItems(deals);
  if (pendingMoveIds.size === 0) return fromApi;

  const byId = new Map(fromApi.map((item) => [item.id, item]));
  for (const local of current) {
    if (!pendingMoveIds.has(local.id)) continue;
    // Mantém coluna otimista até a mutation confirmar (ou falhar).
    byId.set(local.id, local);
  }
  return Array.from(byId.values());
}

type LeadsKanbanBoardProps = {
  deals: readonly DealDetail[];
  columns: Record<DealStage, KanbanDealsColumnState>;
  onLoadMore: (stage: DealStage, totalInColumn: number) => void;
  isBoardFetching?: boolean;
  onPromoteToTransaction?: (
    lead: ContactLeadDetail,
    options?: {
      initialStatus?: 'PROPOSAL' | 'CONTRACT_SIGNED';
      dealId?: string;
      propertyId?: string | null;
      propertyName?: string | null;
    },
  ) => void;
};

export function LeadsKanbanBoard({
  deals,
  columns,
  onLoadMore,
  onPromoteToTransaction,
}: LeadsKanbanBoardProps) {
  const [items, setItems] = useState(() => toKanbanItems(deals));
  const pendingMoveIdsRef = useRef(new Set<string>());
  const [pendingTick, setPendingTick] = useState(0);
  const updateStage = useUpdateDealStageMutation();

  useEffect(() => {
    setItems((current) =>
      mergeDealsIntoItems(current, deals, pendingMoveIdsRef.current),
    );
  }, [deals, pendingTick]);

  const counts = useMemo(() => {
    const next = {} as Record<DealStage, number>;
    for (const stage of DEAL_KANBAN_STAGES) {
      next[stage] = columns[stage].total;
    }
    return next;
  }, [columns]);

  async function promoteDealToTransaction(deal: DealDetail) {
    if (!onPromoteToTransaction) return;
    const lead = await getLeadById(deal.leadId);
    if (!lead) {
      toast.error('Lead não encontrado para criar transação');
      return;
    }
    onPromoteToTransaction(lead, {
      initialStatus: 'CONTRACT_SIGNED',
      dealId: deal.id,
      propertyId: deal.propertyId,
      propertyName: deal.propertyName,
    });
  }

  async function handleCardDrop(
    nextData: DealKanbanItem[],
    meta: { cardId: string; fromColumn: string | null; toColumn: string },
  ) {
    if (!meta.fromColumn || meta.fromColumn === meta.toColumn) return;

    const stage = meta.toColumn as DealStage;
    if (!DEAL_KANBAN_STAGES.includes(stage)) return;

    const deal = nextData.find((item) => item.id === meta.cardId)?.deal;
    if (
      stage === 'property_selected' &&
      deal &&
      !dealHasSelectedProperty(deal)
    ) {
      toast.error(
        'Vincule um imóvel ao lead antes de mover para Imóvel selecionado.',
      );
      setItems((current) =>
        current.map((item) =>
          item.id === meta.cardId
            ? {
                ...item,
                column: meta.fromColumn as DealStage,
              }
            : item,
        ),
      );
      return;
    }

    if (stage === 'payment_confirmed' && deal && !deal.transactionId) {
      toast.error(
        'Confirme o pagamento na transação (Negócios) para avançar esta etapa.',
      );
      setItems((current) =>
        current.map((item) =>
          item.id === meta.cardId
            ? {
                ...item,
                column: meta.fromColumn as DealStage,
              }
            : item,
        ),
      );
      return;
    }

    pendingMoveIdsRef.current = new Set(pendingMoveIdsRef.current).add(meta.cardId);
    setPendingTick((n) => n + 1);
    // Já está na coluna de destino (dragOver); garante estágio local.
    setItems((current) =>
      current.map((item) =>
        item.id === meta.cardId
          ? {
              ...item,
              column: stage,
              deal: {
                ...item.deal,
                stage,
                ...(stage === 'awaiting_property'
                  ? { propertyId: undefined, propertyName: '' }
                  : {}),
              },
            }
          : item,
      ),
    );

    try {
      const updated = await updateStage.mutateAsync({
        id: meta.cardId,
        stage,
      });
      if (!updated) {
        toast.error('Não foi possível atualizar a etapa do negócio');
        pendingMoveIdsRef.current = new Set(
          [...pendingMoveIdsRef.current].filter((id) => id !== meta.cardId),
        );
        setPendingTick((n) => n + 1);
        setItems(toKanbanItems(deals));
        return;
      }

      toast.success(`Etapa atualizada para ${DEAL_STAGE_LABEL[stage]}`);

      setItems((current) =>
        current.map((item) =>
          item.id === meta.cardId
            ? {
                ...item,
                column: stage,
                deal: {
                  ...updated,
                  transactionId: deal?.transactionId ?? updated.transactionId,
                },
              }
            : item,
        ),
      );

      pendingMoveIdsRef.current = new Set(
        [...pendingMoveIdsRef.current].filter((id) => id !== meta.cardId),
      );
      setPendingTick((n) => n + 1);

      if (
        stage === 'contract_signed' &&
        !deal?.transactionId &&
        onPromoteToTransaction
      ) {
        void promoteDealToTransaction({
          ...updated,
          transactionId: deal?.transactionId,
        });
      }
    } catch (error) {
      const message =
        error instanceof ImoveisApiError
          ? error.message
          : 'Não foi possível atualizar a etapa do negócio';
      toast.error(message);
      pendingMoveIdsRef.current = new Set(
        [...pendingMoveIdsRef.current].filter((id) => id !== meta.cardId),
      );
      setPendingTick((n) => n + 1);
      setItems(toKanbanItems(deals));
    }
  }

  return (
    <KanbanProvider<DealKanbanItem, DealKanbanColumn>
      id="imoveis-deals-kanban"
      columns={COLUMNS}
      data={items}
      layout="scroll"
      className="w-full min-w-0"
      onDataChange={setItems}
      canMoveCard={(item, { toColumn }) => {
        if (toColumn === 'property_selected') {
          return dealHasSelectedProperty(item.deal);
        }
        // Pagamento confirmado só via confirmação na transação (precisa de vínculo).
        if (toColumn === 'payment_confirmed' && !item.deal.transactionId) {
          return false;
        }
        return true;
      }}
      onCardDrop={handleCardDrop}
      renderOverlay={(item) => (
        <LeadsKanbanCard
          deal={item.deal}
          column={item.column}
          onCreateTransaction={
            onPromoteToTransaction ? promoteDealToTransaction : undefined
          }
        />
      )}
    >
      {(column) => {
        const columnState = columns[column.id];

        return (
          <KanbanBoard
            key={column.id}
            id={column.id}
            sortable={false}
            className="flex h-full max-h-[min(36rem,calc(100dvh-14rem))] w-[min(17.5rem,85vw)] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-border/60 bg-card shadow-sm ring-0 md:w-0 md:min-w-0 md:flex-1 md:shrink md:snap-align-none"
          >
            <KanbanHeader className="shrink-0 gap-2 border-b border-border bg-transparent px-3.5 py-3">
              <Box
                aria-hidden
                sx={{
                  width: 8,
                  height: 8,
                  flexShrink: 0,
                  borderRadius: 999,
                  bgcolor: COLUMN_DOT[column.id],
                }}
              />
              <Typography
                title={column.name}
                sx={{
                  minWidth: 0,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                }}
              >
                {column.name}
              </Typography>
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 24,
                  height: 24,
                  px: 0.75,
                  borderRadius: 999,
                  bgcolor: 'secondary.main',
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                  pointerEvents: 'none',
                }}
              >
                {counts[column.id]}
              </Box>
            </KanbanHeader>

            {columnState.isLoading && columnState.items.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 4,
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                }}
              >
                Carregando…
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  minHeight: 0,
                  flex: 1,
                  flexDirection: 'column',
                }}
              >
                <KanbanCards<DealKanbanItem>
                  id={column.id}
                  className="gap-3 bg-transparent p-3"
                  emptyState={
                    <Box
                      sx={{
                        display: 'flex',
                        height: 80,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '16px',
                        bgcolor: 'secondary.main',
                        px: 1.5,
                        textAlign: 'center',
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                      }}
                    >
                      Nenhum negócio
                    </Box>
                  }
                >
                  {(item) => (
                    <KanbanCard
                      id={item.id}
                      className="border-0 bg-transparent p-0 shadow-none"
                    >
                      <LeadsKanbanCard
                        deal={item.deal}
                        column={item.column}
                        onCreateTransaction={
                          onPromoteToTransaction
                            ? promoteDealToTransaction
                            : undefined
                        }
                      />
                    </KanbanCard>
                  )}
                </KanbanCards>

                {columnState.hasMore ? (
                  <Box
                    sx={{
                      flexShrink: 0,
                      borderTop: 1,
                      borderColor: 'divider',
                      px: 1,
                      py: 0.75,
                    }}
                  >
                    <Button
                      type="button"
                      fullWidth
                      size="small"
                      variant="text"
                      color="inherit"
                      disabled={columnState.isFetching}
                      onClick={() => onLoadMore(column.id, columnState.total)}
                      sx={{
                        minHeight: 28,
                        py: 0.25,
                        px: 1,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontSize: '0.6875rem',
                        fontWeight: 500,
                        lineHeight: 1.3,
                        color: 'text.secondary',
                        '&:hover': {
                          bgcolor: 'secondary.main',
                          color: 'text.primary',
                        },
                      }}
                    >
                      {columnState.isFetching
                        ? 'Carregando…'
                        : `Ver mais (${columnState.items.length}/${columnState.total})`}
                    </Button>
                  </Box>
                ) : null}
              </Box>
            )}
          </KanbanBoard>
        );
      }}
    </KanbanProvider>
  );
}
