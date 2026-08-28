"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@/ui";
import type { ApproachOutcome, Consultant, Product } from "@/lib/mock-db";
import { formatCents } from "@/lib/money";

const OUTCOMES: Array<{ id: ApproachOutcome; label: string; hint: string }> = [
  { id: "matriculado", label: "Matriculou", hint: "Fecha a venda agora, na sala." },
  { id: "pensando", label: "Vai pensar", hint: "Segue no funil, com follow-up." },
  { id: "recusou", label: "Recusou", hint: "Registra o motivo — é o dado que falta depois." },
  { id: "abordado", label: "Só abordado", hint: "Conversou, sem desfecho ainda." },
];

export type ApproachDialogProps = {
  open: boolean;
  personName?: string;
  consultants: Consultant[];
  products: Product[];
  defaultConsultantId?: string;
  onCancel: () => void;
  onConfirm: (input: {
    outcome: ApproachOutcome;
    consultantId: string;
    note?: string;
    productId?: string;
  }) => void;
};

/**
 * O desfecho da abordagem.
 *
 * O formulário zera por remontagem (`key` na chamada): numa sala, abrir a
 * caixa com o desfecho da pessoa anterior seria erro caro.
 *
 * A tela pede **quem** abordou e **o que aconteceu** — sem isso, a conversão
 * do evento vira um número sem dono, e ninguém aprende nada com ele. Quando o
 * desfecho é matrícula, o produto vendido é obrigatório: é ele que vira venda.
 */
export function ApproachDialog({
  open,
  personName,
  consultants,
  products,
  defaultConsultantId,
  onCancel,
  onConfirm,
}: ApproachDialogProps) {
  const [outcome, setOutcome] = useState<ApproachOutcome>("matriculado");
  const [consultantId, setConsultantId] = useState(
    defaultConsultantId ?? consultants[0]?.id ?? "",
  );
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [note, setNote] = useState("");

  const needsProduct = outcome === "matriculado";
  const product = products.find((item) => item.id === productId);

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Resultado da abordagem</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {personName ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {personName}
            </Typography>
          ) : null}

          <Stack spacing={1}>
            {OUTCOMES.map((item) => (
              <Stack
                key={item.id}
                component="button"
                type="button"
                onClick={() => setOutcome(item.id)}
                spacing={0.25}
                sx={{
                  textAlign: "left",
                  p: 1.25,
                  borderRadius: 2,
                  border: 1,
                  cursor: "pointer",
                  font: "inherit",
                  borderColor: outcome === item.id ? "primary.main" : "divider",
                  bgcolor: outcome === item.id ? "action.selected" : "transparent",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {item.hint}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Quem abordou
            </Typography>
            <Select
              size="small"
              value={consultantId}
              onChange={(event) => setConsultantId(String(event.target.value))}
              fullWidth
            >
              {consultants.map((consultant) => (
                <MenuItem key={consultant.id} value={consultant.id}>
                  {consultant.name}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          {needsProduct ? (
            <Stack spacing={0.5}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Produto vendido
              </Typography>
              <Select
                size="small"
                value={productId}
                onChange={(event) => setProductId(String(event.target.value))}
                fullWidth
              >
                {products.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.shortName} — {formatCents(item.listPriceCents)}
                  </MenuItem>
                ))}
              </Select>
              {product ? (
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  A venda entra pelo preço de tabela; o desconto é negociado na ficha.
                </Typography>
              ) : null}
            </Stack>
          ) : null}

          <Input
            size="small"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={
              outcome === "recusou"
                ? "Por que não fechou?"
                : "Observação (opcional)"
            }
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="text" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!consultantId || (needsProduct && !productId)}
          onClick={() =>
            onConfirm({
              outcome,
              consultantId,
              note: note.trim() || undefined,
              productId: needsProduct ? productId : undefined,
            })
          }
        >
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
