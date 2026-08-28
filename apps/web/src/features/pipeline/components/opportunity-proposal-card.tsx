"use client";

import { useState } from "react";
import GavelIcon from "@mui/icons-material/Gavel";
import {
  Button,
  CurrencyInput,
  Divider,
  MenuItem,
  NumberInput,
  Paper,
  Select,
  Stack,
  Typography,
} from "@/ui";
import { SemanticBadge, type SemanticTone } from "@/components/ui/status";
import type { ApprovalStatus, PaymentMethod, Product, Proposal } from "@/lib/mock-db";
import { formatCents, formatPercent } from "@/lib/money";

const METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: "pix", label: "Pix" },
  { id: "cartao_credito", label: "Cartão de crédito" },
  { id: "boleto", label: "Boleto" },
  { id: "transferencia", label: "Transferência" },
  { id: "dinheiro", label: "Dinheiro" },
];

const APPROVAL_LABEL: Record<ApprovalStatus, { label: string; tone: SemanticTone }> = {
  rascunho: { label: "Rascunho", tone: "neutral" },
  aguardando_aprovacao: { label: "Aguardando aprovação", tone: "warning" },
  aprovada: { label: "Dentro da alçada", tone: "success" },
  recusada: { label: "Desconto recusado", tone: "error" },
};

export type OpportunityProposalCardProps = {
  product?: Product;
  proposal?: Proposal;
  canDecide: boolean;
  isBusy?: boolean;
  onSave: (input: {
    discountCents: number;
    downPaymentCents: number;
    installments: number;
    paymentMethod: PaymentMethod;
  }) => void;
  onDecide: (approve: boolean) => void;
};

/**
 * A condição negociada — com alçada.
 *
 * O card mostra **tabela** e **praticado** lado a lado de propósito: o desconto
 * é a informação que some primeiro quando se guarda só o valor final, e é
 * justamente ela que explica a margem da unidade. Passar da alçada do produto
 * não bloqueia a venda; manda para aprovação e deixa isso visível.
 */
export function OpportunityProposalCard({
  product,
  proposal,
  canDecide,
  isBusy,
  onSave,
  onDecide,
}: OpportunityProposalCardProps) {
  const listPriceCents = proposal?.listPriceCents ?? product?.listPriceCents ?? 0;
  const limit = product?.maxDiscountPercent ?? 0;

  const [discount, setDiscount] = useState((proposal?.discountCents ?? 0) / 100);
  const [downPayment, setDownPayment] = useState(
    (proposal?.downPaymentCents ?? 0) / 100,
  );
  const [installments, setInstallments] = useState(proposal?.installments ?? 1);
  const [method, setMethod] = useState<PaymentMethod>(
    proposal?.paymentMethod ?? "pix",
  );
  const [editing, setEditing] = useState(!proposal);

  // Quando a proposta salva muda (salvar, aprovar, recusar), o formulário volta
  // a refletir o que está gravado. O ajuste é durante o render, não em efeito:
  // é o padrão do React para estado derivado de prop.
  const [lastProposal, setLastProposal] = useState(proposal);
  if (proposal !== lastProposal) {
    setLastProposal(proposal);
    setDiscount((proposal?.discountCents ?? 0) / 100);
    setDownPayment((proposal?.downPaymentCents ?? 0) / 100);
    setInstallments(proposal?.installments ?? 1);
    setMethod(proposal?.paymentMethod ?? "pix");
    setEditing(!proposal);
  }

  const discountCents = Math.round(discount * 100);
  const netCents = Math.max(0, listPriceCents - discountCents);
  const percent = listPriceCents > 0 ? (discountCents / listPriceCents) * 100 : 0;
  const aboveLimit = percent > limit;
  const financedCents = Math.max(0, netCents - Math.round(downPayment * 100));
  const installmentCents = installments > 0 ? Math.round(financedCents / installments) : 0;

  const status = proposal?.approvalStatus;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Proposta
          </Typography>
          {status ? (
            <SemanticBadge
              label={APPROVAL_LABEL[status].label}
              tone={APPROVAL_LABEL[status].tone}
            />
          ) : null}
        </Stack>

        <Stack direction="row" spacing={2}>
          <Stack sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Tabela
            </Typography>
            <Typography variant="body2" sx={{ textDecoration: discountCents > 0 ? "line-through" : "none" }}>
              {formatCents(listPriceCents)}
            </Typography>
          </Stack>
          <Stack sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Praticado
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatCents(netCents)}
            </Typography>
          </Stack>
          <Stack sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Desconto
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: aboveLimit ? "warning.dark" : "text.primary" }}
            >
              {formatPercent(Math.round(percent * 10) / 10)}
            </Typography>
          </Stack>
        </Stack>

        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Alçada do consultor neste produto: {formatPercent(limit)}.
          {aboveLimit ? " Acima disso, a diretoria decide." : ""}
        </Typography>

        <Divider />

        {editing ? (
          <Stack spacing={1.5}>
            <Field label="Desconto (R$)">
              <CurrencyInput size="small" value={discount} onValueChange={setDiscount} />
            </Field>
            <Stack direction="row" spacing={1.5}>
              <Field label="Entrada (R$)" sx={{ flex: 1 }}>
                <CurrencyInput
                  size="small"
                  value={downPayment}
                  onValueChange={setDownPayment}
                />
              </Field>
              <Field label="Parcelas" sx={{ width: 120 }}>
                <NumberInput
                  size="small"
                  minValue={1}
                  value={installments}
                  onValueChange={(value) => setInstallments(Math.max(1, value))}
                />
              </Field>
            </Stack>
            <Field label="Forma de pagamento">
              <Select
                size="small"
                value={method}
                onChange={(event) => setMethod(event.target.value as PaymentMethod)}
                fullWidth
              >
                {METHODS.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </Field>

            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {installments}× de {formatCents(installmentCents)} após a entrada.
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                type="button"
                variant="contained"
                disabled={isBusy}
                onClick={() =>
                  onSave({
                    discountCents,
                    downPaymentCents: Math.round(downPayment * 100),
                    installments,
                    paymentMethod: method,
                  })
                }
              >
                {aboveLimit ? "Enviar para aprovação" : "Salvar proposta"}
              </Button>
              {proposal ? (
                <Button type="button" variant="text" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              ) : null}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Entrada de {formatCents(proposal?.downPaymentCents ?? 0)} e{" "}
              {proposal?.installments ?? 1}× de {formatCents(installmentCents)} ·{" "}
              {METHODS.find((item) => item.id === proposal?.paymentMethod)?.label}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button type="button" variant="outlined" onClick={() => setEditing(true)}>
                Editar condição
              </Button>

              {status === "aguardando_aprovacao" && canDecide ? (
                <>
                  <Button
                    type="button"
                    variant="contained"
                    color="success"
                    startIcon={<GavelIcon sx={{ fontSize: 16 }} />}
                    disabled={isBusy}
                    onClick={() => onDecide(true)}
                  >
                    Aprovar
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    color="error"
                    disabled={isBusy}
                    onClick={() => onDecide(false)}
                  >
                    Recusar
                  </Button>
                </>
              ) : null}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function Field({
  label,
  children,
  sx,
}: {
  label: string;
  children: React.ReactNode;
  sx?: React.ComponentProps<typeof Stack>["sx"];
}) {
  return (
    <Stack spacing={0.5} sx={sx}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      {children}
    </Stack>
  );
}
