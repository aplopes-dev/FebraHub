"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@/ui";
import { getConversionOptions } from "@/features/leads/services/leads.service";
import { formatIsoDate } from "@/lib/date";

export type ConvertLeadDialogProps = {
  open: boolean;
  personName?: string;
  defaultProductId?: string;
  defaultOwnerId?: string;
  onCancel: () => void;
  onConfirm: (input: {
    funnelId: string;
    productId: string;
    editionId?: string;
    ownerId: string;
  }) => void;
};

/**
 * Converter lead em oportunidade.
 *
 * O formulário zera por remontagem (`key` na chamada), não por efeito.
 *
 * A origem **não** é escolhida aqui — ela vem do lead e segue intacta. É a
 * única forma de, meses depois, saber que a matrícula nasceu de um anúncio ou
 * de uma indicação.
 */
export function ConvertLeadDialog({
  open,
  personName,
  defaultProductId,
  defaultOwnerId,
  onCancel,
  onConfirm,
}: ConvertLeadDialogProps) {
  const options = getConversionOptions();
  const [funnelId, setFunnelId] = useState(options.funnels[0]?.id ?? "");
  const [productId, setProductId] = useState(
    defaultProductId ?? options.products[0]?.id ?? "",
  );
  const [editionId, setEditionId] = useState<string>("");
  const [ownerId, setOwnerId] = useState(defaultOwnerId ?? options.owners[0]?.id ?? "");

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Converter em oportunidade</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          {personName ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {personName}
            </Typography>
          ) : null}

          <Field label="Funil">
            <Select
              size="small"
              value={funnelId}
              onChange={(event) => setFunnelId(String(event.target.value))}
              fullWidth
            >
              {options.funnels.map((funnel) => (
                <MenuItem key={funnel.id} value={funnel.id}>
                  {funnel.name}
                </MenuItem>
              ))}
            </Select>
          </Field>

          <Field label="Produto de interesse">
            <Select
              size="small"
              value={productId}
              onChange={(event) => setProductId(String(event.target.value))}
              fullWidth
            >
              {options.products.map((product) => (
                <MenuItem key={product.id} value={product.id}>
                  {product.shortName}
                </MenuItem>
              ))}
            </Select>
          </Field>

          <Field label="Turma pretendida (opcional)">
            <Select
              size="small"
              value={editionId}
              onChange={(event) => setEditionId(String(event.target.value))}
              fullWidth
              displayEmpty
            >
              <MenuItem value="">Turma a definir</MenuItem>
              {options.editions.map((edition) => (
                <MenuItem key={edition.id} value={edition.id}>
                  {edition.name} · {formatIsoDate(edition.startsAt)}
                </MenuItem>
              ))}
            </Select>
          </Field>

          <Field label="Responsável">
            <Select
              size="small"
              value={ownerId}
              onChange={(event) => setOwnerId(String(event.target.value))}
              fullWidth
            >
              {options.owners.map((owner) => (
                <MenuItem key={owner.id} value={owner.id}>
                  {owner.name}
                </MenuItem>
              ))}
            </Select>
          </Field>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="text" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!funnelId || !productId || !ownerId}
          onClick={() =>
            onConfirm({
              funnelId,
              productId,
              editionId: editionId || undefined,
              ownerId,
            })
          }
        >
          Criar oportunidade
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      {children}
    </Stack>
  );
}
