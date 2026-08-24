"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormField,
  NumberInput,
} from "@citybox/mui";
import { ProductionInsumosTable } from "@/features/production/components/production-insumos-table";
import { scaleInsumos } from "@/features/production/lib/production-calc";
import { useProductionOrderQuery } from "@/features/production/hooks/use-production-order-query";
import type { ProductionOrder } from "@/features/production/types/production";

type FinalizeRequest = {
  order: ProductionOrder;
  quantity: number;
};

type ProductionFinalizeDialogProps = {
  request: FinalizeRequest | null;
  isSubmitting?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    order: ProductionOrder,
    producedQuantity: number,
    observation?: string,
  ) => void;
};

/**
 * Confirmação de finalização como diálogo independente (não vive dentro do
 * `ProductionOrderDrawer`): um `Dialog` aninhado num `Drawer` (vaul) trava
 * foco/clique nos campos, então esse fluxo sempre fecha o drawer antes de
 * abrir aqui — inclusive quando disparado por arraste no Kanban.
 */
export function ProductionFinalizeDialog({
  request,
  isSubmitting = false,
  onOpenChange,
  onConfirm,
}: ProductionFinalizeDialogProps) {
  return (
    <Dialog
      open={request != null}
      onClose={() => onOpenChange(false)}
      maxWidth="md"
      fullWidth
    >
      {request ? (
        <ProductionFinalizeDialogBody
          request={request}
          isSubmitting={isSubmitting}
          onOpenChange={onOpenChange}
          onConfirm={onConfirm}
        />
      ) : null}
    </Dialog>
  );
}

function ProductionFinalizeDialogBody({
  request,
  isSubmitting,
  onOpenChange,
  onConfirm,
}: {
  request: FinalizeRequest;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    order: ProductionOrder,
    producedQuantity: number,
    observation?: string,
  ) => void;
}) {
  const [quantity, setQuantity] = useState(request.quantity);
  const [observation, setObservation] = useState("");

  const detailQuery = useProductionOrderQuery(request.order.id);
  const insumos = detailQuery.data?.insumos ?? [];
  const scaledInsumos = scaleInsumos(insumos, quantity);

  return (
    <>
      <DialogTitle>
        Finalizar produção — {request.order.productName}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <DialogContentText>
          Confirme a quantidade produzida antes de dar saída dos insumos no
          estoque de origem e entrada do produto no destino. Essa ação não
          pode ser desfeita.
        </DialogContentText>

        <NumberInput
          id="finalize-quantity"
          label="Quantidade produzida"
          value={quantity}
          minValue={0}
          step={1}
          onValueChange={(value) => setQuantity(Math.max(0, value))}
          aria-label="Quantidade produzida"
        />

        <FormField
          id="finalize-observation"
          label="Observação (opcional)"
          value={observation}
          onChange={(event) => setObservation(event.target.value)}
          placeholder="Ex.: rendeu menos que o planejado por perda de massa…"
          multiline
          minRows={3}
        />

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Resumo de custos
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
            Insumos consumidos para {quantity} unidade(s) produzida(s).
          </Typography>
          <ProductionInsumosTable
            insumos={scaledInsumos}
            showCost
            loading={detailQuery.isLoading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={quantity <= 0}
          loading={isSubmitting}
          onClick={() =>
            onConfirm(request.order, quantity, observation.trim() || undefined)
          }
        >
          Finalizar e movimentar estoque
        </Button>
      </DialogActions>
    </>
  );
}
