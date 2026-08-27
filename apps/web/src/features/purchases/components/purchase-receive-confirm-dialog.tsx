"use client";

import { useMemo, useState } from "react";
import Stack from "@mui/material/Stack";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ScrollArea,
  toast,
} from "@/ui";
import {
  PurchaseReceiveLineRow,
  type ReceiveLineDraft,
} from "@/features/purchases/components/purchase-receive-line-row";
import type { PurchaseLine } from "@/features/purchases/types/purchase";
import type { Product } from "@/features/products/types/product";

export type { ReceiveLineDraft };

type PurchaseReceiveConfirmDialogProps = {
  open: boolean;
  products: Product[];
  lines: PurchaseLine[];
  onClose: () => void;
  onConfirm: (drafts: ReceiveLineDraft[]) => void;
};

function buildDrafts(lines: PurchaseLine[]): ReceiveLineDraft[] {
  return lines
    .filter((line) => line.status !== "cancelled")
    .map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      status: "received" as const,
    }));
}

export function PurchaseReceiveConfirmDialog({
  open,
  products,
  lines,
  onClose,
  onConfirm,
}: PurchaseReceiveConfirmDialogProps) {
  const [drafts, setDrafts] = useState<ReceiveLineDraft[]>([]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const [wasOpen, setWasOpen] = useState(open);

  // Ajuste durante o render, não efeito — ver purchase-extras-dialog. Aqui o
  // risco era maior: `lines` muda a cada tecla no formulário, e o efeito
  // descartava as quantidades já conferidas no diálogo de recebimento.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDrafts(buildDrafts(lines));
  }

  function updateDraft(
    productId: string,
    patch: Partial<Pick<ReceiveLineDraft, "quantity" | "status">>,
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.productId === productId ? { ...draft, ...patch } : draft,
      ),
    );
  }

  function handleConfirm() {
    const received = drafts.filter((draft) => draft.status === "received");
    if (received.length === 0) {
      toast.error("Marque ao menos um item como Recebido.");
      return;
    }
    if (received.some((draft) => draft.quantity <= 0)) {
      toast.error("A quantidade recebida deve ser maior que zero.");
      return;
    }
    onConfirm(drafts);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ flexShrink: 0 }}>Confirmar recebimento</DialogTitle>

      <DialogContent
        dividers
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          px: 0,
          py: 0,
          overflow: "hidden",
        }}
      >
        <DialogContentText sx={{ px: 3, pt: 2, pb: 1.5, flexShrink: 0 }}>
          Confirme o que realmente chegou. Itens recebidos entram no estoque ao
          salvar a compra; cancelados não geram entrada.
        </DialogContentText>

        <ScrollArea
          sx={{
            flex: 1,
            minHeight: 0,
            maxHeight: "60vh",
            px: 3,
            pb: 2,
          }}
        >
          <Stack spacing={2}>
            {drafts.map((draft) => {
              const product = productById.get(draft.productId);
              return (
                <PurchaseReceiveLineRow
                  key={draft.productId}
                  draft={draft}
                  name={product?.name ?? "Produto"}
                  sku={product?.sku ?? "—"}
                  onStatusChange={(status) =>
                    updateDraft(draft.productId, { status })
                  }
                  onQuantityChange={(quantity) =>
                    updateDraft(draft.productId, { quantity })
                  }
                />
              );
            })}
          </Stack>
        </ScrollArea>
      </DialogContent>

      <DialogActions sx={{ flexShrink: 0 }}>
        <Button type="button" variant="text" onClick={onClose}>
          Voltar
        </Button>
        <Button type="button" variant="contained" onClick={handleConfirm}>
          Confirmar recebimento
        </Button>
      </DialogActions>
    </Dialog>
  );
}
