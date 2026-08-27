"use client";

import { useState } from "react";
import BlockIcon from "@mui/icons-material/Block";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  ConfirmationDialog,
  Drawer,
  FormField,
  NumberInput,
  ScrollArea,
} from "@/ui";
import { ProductionInsumosTable } from "@/features/production/components/production-insumos-table";
import { ProductionStatusBadge } from "@/features/production/components/production-status-badge";
import { formatIsoDate } from "@/lib/date";
import { scaleInsumos } from "@/features/production/lib/production-calc";
import { useProductionHistoryQuery } from "@/features/production/hooks/use-production-history-query";
import { useProductionOrderQuery } from "@/features/production/hooks/use-production-order-query";
import { useAddProductionCommentMutation } from "@/features/production/hooks/use-production-mutations";
import type {
  ComputedInsumo,
  ProductionOrder,
} from "@/features/production/types/production";

type ProductionOrderDrawerProps = {
  order: ProductionOrder | null;
  onOpenChange: (open: boolean) => void;
  onStart: (order: ProductionOrder) => void;
  onRequestFinalize: (order: ProductionOrder, producedQuantity: number) => void;
  onCancel: (order: ProductionOrder) => void;
};

type AuditTimelineEntry = {
  id: string;
  date: Date | string;
  title: string;
  description?: string | null;
};

export function ProductionOrderDrawer({
  order,
  onOpenChange,
  onStart,
  onRequestFinalize,
  onCancel,
}: ProductionOrderDrawerProps) {
  return (
    <Drawer
      open={order != null}
      onClose={() => onOpenChange(false)}
      title={
        order ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
              {order.productName}
            </Typography>
            <ProductionStatusBadge status={order.status} />
          </Stack>
        ) : undefined
      }
      width={768}
    >
      {order ? (
        <ProductionOrderDrawerContent
          order={order}
          onOpenChange={onOpenChange}
          onStart={onStart}
          onRequestFinalize={onRequestFinalize}
          onCancel={onCancel}
        />
      ) : null}
    </Drawer>
  );
}

function ProductionOrderDrawerContent({
  order,
  onOpenChange,
  onStart,
  onRequestFinalize,
  onCancel,
}: {
  order: ProductionOrder;
  onOpenChange: (open: boolean) => void;
  onStart: (order: ProductionOrder) => void;
  onRequestFinalize: (order: ProductionOrder, producedQuantity: number) => void;
  onCancel: (order: ProductionOrder) => void;
}) {
  const [produced, setProduced] = useState(order.plannedQuantity);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [comment, setComment] = useState("");

  const detailQuery = useProductionOrderQuery(order.id);
  const historyQuery = useProductionHistoryQuery(order.id);
  const addCommentMutation = useAddProductionCommentMutation();

  const insumos = detailQuery.data?.insumos ?? [];
  const historyEntries = historyQuery.data ?? [];

  const divergence = produced - order.plannedQuantity;
  const isPending = order.status === "pending";
  const isInProgress = order.status === "in_progress";
  const isCompleted = order.status === "completed";
  const isCancelled = order.status === "cancelled";
  const isCancellable = isPending || isInProgress;

  const timelineEntries: AuditTimelineEntry[] = historyEntries.map(
    (entry) => ({
      id: entry.id,
      date: entry.createdAt,
      title: `${entry.title} — ${entry.userName}`,
      description: entry.description,
    }),
  );

  function handleAddComment() {
    const trimmed = comment.trim();
    if (!trimmed) return;
    addCommentMutation.mutate(
      { orderId: order.id, description: trimmed },
      { onSuccess: () => setComment("") },
    );
  }

  return (
    <>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
          <Stack spacing={3} sx={{ pb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Planejado {order.plannedQuantity} un · {order.sourceStockName} →{" "}
              {order.destinationStockName} · Previsão{" "}
              {formatIsoDate(order.expectedDate)}
            </Typography>

            <Stack spacing={2.5}>
              {isCompleted ? (
                <CompletedSummary order={order} insumos={insumos} />
              ) : null}
              {isCancelled ? <CancelledSummary order={order} /> : null}

              {!isCompleted && !isCancelled ? (
                <>
                  {isInProgress ? (
                    <Box sx={{ maxWidth: 280 }}>
                      <NumberInput
                        id="produced-quantity"
                        label="Quantidade final produzida"
                        value={produced}
                        minValue={0}
                        step={1}
                        onValueChange={(value) => setProduced(Math.max(0, value))}
                        aria-label="Quantidade final produzida"
                      />
                      {divergence !== 0 ? (
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.75,
                            fontWeight: 600,
                            color: "warning.main",
                          }}
                        >
                          {divergence > 0
                            ? `${divergence} a mais que o planejado`
                            : `${Math.abs(divergence)} a menos que o planejado`}
                        </Typography>
                      ) : null}
                    </Box>
                  ) : null}

                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      {isInProgress ? "Resumo de custos" : "Separação de insumos"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1.5 }}
                    >
                      {isInProgress
                        ? `Insumos consumidos para ${produced} unidade(s) produzida(s).`
                        : `Ficha técnica multiplicada pela quantidade a produzir (${order.plannedQuantity}×).`}
                    </Typography>
                    <ProductionInsumosTable
                      insumos={isInProgress ? scaleInsumos(insumos, produced) : insumos}
                      showCost={isInProgress}
                      loading={detailQuery.isLoading}
                    />
                  </Box>
                </>
              ) : null}
            </Stack>

            <Box
              sx={{
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
                p: 2,
              }}
            >
              <Stack spacing={2}>
                <FormField
                  id="prod-comment"
                  label="Adicionar comentário"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Registre uma observação sobre este pedido…"
                  multiline
                  minRows={3}
                />
                <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="outlined"
                    disabled={!comment.trim()}
                    loading={addCommentMutation.isPending}
                    onClick={handleAddComment}
                  >
                    Comentar
                  </Button>
                </Stack>

                <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                    Histórico
                  </Typography>
                  <ProductionAuditTimeline entries={timelineEntries} />
                </Box>
              </Stack>
            </Box>
          </Stack>
        </ScrollArea>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "flex-end",
            flexWrap: "wrap",
            pt: 2,
            mt: "auto",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Button type="button" variant="outlined" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {isCancellable ? (
            <Button
              type="button"
              variant="text"
              color="inherit"
              startIcon={<BlockIcon fontSize="small" />}
              onClick={() => setCancelConfirmOpen(true)}
            >
              Cancelar produção
            </Button>
          ) : null}
          {isPending ? (
            <Button
              type="button"
              variant="contained"
              startIcon={<PlayArrowIcon fontSize="small" />}
              onClick={() => onStart(order)}
            >
              Iniciar Produção
            </Button>
          ) : null}
          {isInProgress ? (
            <Button
              type="button"
              variant="contained"
              disabled={produced <= 0}
              onClick={() => onRequestFinalize(order, produced)}
            >
              Finalizar Produção
            </Button>
          ) : null}
        </Stack>
      </Box>

      <ConfirmationDialog
        open={cancelConfirmOpen}
        title="Cancelar produção"
        description="O pedido será marcado como cancelado e sai do fluxo ativo. Como nada foi movimentado no estoque ainda, não há nada para estornar. Essa ação não pode ser desfeita."
        confirmLabel="Cancelar produção"
        confirmColor="error"
        onConfirm={() => onCancel(order)}
        onCancel={() => setCancelConfirmOpen(false)}
      />
    </>
  );
}

function ProductionAuditTimeline({ entries }: { entries: AuditTimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhum registro de auditoria encontrado.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {entries.map((entry, index) => (
        <Stack
          key={entry.id}
          direction="row"
          spacing={2}
          sx={{ pb: index < entries.length - 1 ? 3 : 0, position: "relative" }}
        >
          {index < entries.length - 1 ? (
            <Box
              aria-hidden
              sx={{
                position: "absolute",
                left: 11,
                top: 24,
                bottom: 0,
                width: "1px",
                bgcolor: "divider",
              }}
            />
          ) : null}
          <Box
            sx={{
              mt: 0.25,
              width: 24,
              height: 24,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "primary.main",
              }}
            />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatAuditDate(entry.date)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
              {entry.title}
            </Typography>
            {entry.description ? (
              <Typography variant="body2" color="text.secondary">
                {entry.description}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

function formatAuditDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

function CompletedSummary({
  order,
  insumos,
}: {
  order: ProductionOrder;
  insumos: ComputedInsumo[];
}) {
  const producedQuantity = order.producedQuantity ?? 0;
  const divergence = producedQuantity - order.plannedQuantity;

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <SummaryItem label="Quantidade produzida" value={`${producedQuantity} un`} />
        <SummaryItem
          label="Divergência"
          value={
            divergence === 0
              ? "Sem divergência"
              : divergence > 0
                ? `+${divergence} un`
                : `${divergence} un`
          }
        />
      </Box>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          Insumos consumidos
        </Typography>
        <ProductionInsumosTable insumos={insumos} showCost />
      </Box>
      <Typography variant="caption" color="text.secondary">
        A baixa dos insumos e a entrada do produto já foram registradas em
        Movimentações.
      </Typography>
    </Stack>
  );
}

function CancelledSummary({ order }: { order: ProductionOrder }) {
  return (
    <Stack spacing={1.5}>
      <SummaryItem
        label="Cancelado em"
        value={
          order.cancelledAt
            ? new Date(order.cancelledAt).toLocaleDateString("pt-BR")
            : "—"
        }
      />
      <Typography variant="caption" color="text.secondary">
        Este pedido não avançou na produção. Como nenhum insumo havia sido
        separado ou dado como consumido, o estoque não foi afetado.
      </Typography>
    </Stack>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 1.5,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}
