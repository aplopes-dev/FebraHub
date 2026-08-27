"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import { Button, ConfirmationDialog, Typography } from "@/ui";
import { SemanticBadge } from "@/components/ui/status";
import { MatchSuggestionCard } from "@/features/bank-reconciliation/components/match-suggestion-card";
import { ManualMatchDrawer } from "@/features/bank-reconciliation/components/manual-match-drawer";
import { CreateEntryFromTransactionDrawer } from "@/features/bank-reconciliation/components/create-entry-from-transaction-drawer";
import { useSuggestionsQuery } from "@/features/bank-reconciliation/hooks/use-bank-statement-queries";
import {
  useCreateEntryFromTransactionMutation,
  useDiscardTransactionMutation,
  useReconcileTransactionMutation,
  useUndoReconciliationMutation,
} from "@/features/bank-reconciliation/hooks/use-bank-reconciliation-mutations";
import {
  bankStatementTransactionColor,
  bankStatementTransactionSign,
  formatCurrencyBRL,
  formatIsoDateBR,
} from "@/features/bank-reconciliation/lib/bank-statement-format";
import type {
  BankStatementTransaction,
  CreateEntryFromTransactionInput,
} from "@/features/bank-reconciliation/types/bank-statement";

type TransactionCardProps = {
  bankStatementId: string;
  bankAccountId: string | null;
  bankAccountLabel: string;
  transaction: BankStatementTransaction;
};

/**
 * Cartão de uma transação pendente (US2/US3, FR-039) — substitui
 * `transaction-row.tsx`: botões reais (Conciliar/Novo Registro/Buscar
 * registro/Excluir), sem checkbox de seleção em lote (a seleção múltipla
 * continua restrita ao drawer "Buscar Registros", FR-036). Aviso/sugestão
 * embutidos no próprio cartão.
 */
export function TransactionCard({
  bankStatementId,
  bankAccountId,
  bankAccountLabel,
  transaction,
}: TransactionCardProps) {
  const isPending = transaction.status === "pending";
  const isReconciled = transaction.status === "reconciled";
  const suggestionQuery = useSuggestionsQuery(bankStatementId, transaction.id, isPending);
  const reconcileMutation = useReconcileTransactionMutation();
  const createEntryMutation = useCreateEntryFromTransactionMutation();
  const discardMutation = useDiscardTransactionMutation();
  const undoMutation = useUndoReconciliationMutation();

  const [manualMatchOpen, setManualMatchOpen] = useState(false);
  const [createEntryOpen, setCreateEntryOpen] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [undoConfirmOpen, setUndoConfirmOpen] = useState(false);
  const [suggestionsHighlighted, setSuggestionsHighlighted] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  function handleReconcile(financialEntryId: string) {
    reconcileMutation.mutate({
      bankStatementId,
      transactionId: transaction.id,
      financialEntryIds: [financialEntryId],
    });
  }

  function handleManualConfirm(financialEntryIds: string[]) {
    reconcileMutation.mutate(
      { bankStatementId, transactionId: transaction.id, financialEntryIds },
      { onSuccess: () => setManualMatchOpen(false) },
    );
  }

  function handleCreateEntryConfirm(input: CreateEntryFromTransactionInput) {
    createEntryMutation.mutate(
      { bankStatementId, transactionId: transaction.id, input },
      { onSuccess: () => setCreateEntryOpen(false) },
    );
  }

  const noAccountReason = "Este extrato não tem uma conta bancária resolvida.";

  // FR-039/D20 — "Conciliar" é o 1º controle da linha de ações, alimentado pelo
  // mesmo `useSuggestionsQuery` que já abastece o bloco de sugestões abaixo
  // (nenhuma requisição nova). Habilitado só quando há candidato exato.
  const suggestion = suggestionQuery.data;
  const exactCandidates = suggestion?.kind === "exact" ? suggestion.candidates : [];
  const canReconcileFromHeader = exactCandidates.length > 0 && !reconcileMutation.isPending;

  function handleHeaderReconcile() {
    // FR-014 proíbe o sistema escolher sozinho: com mais de um candidato, leva o
    // operador até a lista para decidir, em vez de conciliar o primeiro.
    if (exactCandidates.length === 1) {
      handleReconcile(exactCandidates[0].financialEntryId);
      return;
    }
    suggestionsRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    setSuggestionsHighlighted(true);
  }

  // FR-031/FR-039/D18 — a divergência de valor é sinalizada no cartão, não no
  // drawer. `value_divergence` traz o candidato próximo por data cujo valor não
  // fecha; a diferença contra a transação é o que o operador precisa ver.
  const divergentCandidate =
    suggestion?.kind === "value_divergence" ? suggestion.candidates[0] : undefined;
  const divergenceAmount = divergentCandidate
    ? transaction.amount - divergentCandidate.openBalance
    : 0;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <Box sx={{ p: 2 }}>
        <Stack
          direction="row"
          sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}
        >
          <Stack spacing={0.25} sx={{ minWidth: 200, flex: "1 1 260px" }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: bankStatementTransactionColor(transaction.kind),
              }}
            >
              {bankStatementTransactionSign(transaction.kind)}
              {formatCurrencyBRL(transaction.amount)}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatIsoDateBR(transaction.postedAt)} ·{" "}
              {transaction.kind === "credit" ? "Crédito" : "Débito"}
              {transaction.transactionType ? ` · ${transaction.transactionType}` : ""}
            </Typography>
            <Typography variant="body2">{transaction.memo || "Sem descrição"}</Typography>
            {divergentCandidate ? (
              <Stack spacing={0.25} sx={{ pt: 0.5 }}>
                <Box>
                  <SemanticBadge
                    label={`Divergência de valor: ${
                      divergenceAmount > 0 ? "faltam" : "excedem"
                    } ${formatCurrencyBRL(Math.abs(divergenceAmount))}`}
                    tone="warning"
                  />
                </Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Há um lançamento próximo por data, mas o valor não bate exatamente — use a busca
                  manual para investigar.
                </Typography>
              </Stack>
            ) : null}
          </Stack>

          {isPending ? (
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
              <Button
                type="button"
                variant="contained"
                size="small"
                disabled={!canReconcileFromHeader}
                loading={reconcileMutation.isPending}
                onClick={handleHeaderReconcile}
              >
                Conciliar
              </Button>
              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={() => setCreateEntryOpen(true)}
              >
                Novo Registro
              </Button>
              <Tooltip title={!bankAccountId ? noAccountReason : ""}>
                <span>
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    disabled={!bankAccountId}
                    onClick={() => setManualMatchOpen(true)}
                  >
                    Buscar registro
                  </Button>
                </span>
              </Tooltip>
              <IconButton
                size="small"
                color="error"
                aria-label="Excluir transação"
                onClick={() => setDiscardConfirmOpen(true)}
              >
                <DeleteOutlined fontSize="small" />
              </IconButton>
            </Stack>
          ) : null}

          {isReconciled ? (
            <Button type="button" variant="text" size="small" onClick={() => setUndoConfirmOpen(true)}>
              Desfazer conciliação
            </Button>
          ) : null}
        </Stack>

        {isPending ? (
          <Box
            ref={suggestionsRef}
            // O destaque some assim que o operador chega no bloco (mouse ou
            // clique) — sem timer, sem efeito de limpeza para vazar no unmount.
            onPointerEnter={() => setSuggestionsHighlighted(false)}
            onPointerDown={() => setSuggestionsHighlighted(false)}
            sx={{
              mt: 1.5,
              borderRadius: 1,
              outline: suggestionsHighlighted ? "2px solid" : "none",
              outlineColor: "primary.main",
              outlineOffset: 4,
              transition: "outline-color 200ms",
            }}
          >
            <MatchSuggestionCard
              suggestion={suggestionQuery.data}
              isLoading={suggestionQuery.isLoading}
              onReconcile={handleReconcile}
              isReconciling={reconcileMutation.isPending}
            />
          </Box>
        ) : null}
      </Box>

      <ManualMatchDrawer
        open={manualMatchOpen}
        onOpenChange={setManualMatchOpen}
        bankStatementId={bankStatementId}
        transactionId={transaction.id}
        bankAccountLabel={bankAccountLabel}
        transactionAmount={transaction.amount}
        onConfirm={handleManualConfirm}
        isConfirming={reconcileMutation.isPending}
      />

      <CreateEntryFromTransactionDrawer
        open={createEntryOpen}
        transaction={transaction}
        defaultBankAccountId={bankAccountId}
        onOpenChange={setCreateEntryOpen}
        onConfirm={handleCreateEntryConfirm}
        isSaving={createEntryMutation.isPending}
      />

      <ConfirmationDialog
        open={discardConfirmOpen}
        title="Excluir transação"
        description="A transação sai de Pendentes e vai para Excluídas — nada é apagado do sistema."
        confirmLabel="Excluir"
        confirmColor="error"
        loading={discardMutation.isPending}
        onCancel={() => setDiscardConfirmOpen(false)}
        onConfirm={async () => {
          await discardMutation.mutateAsync({ bankStatementId, transactionId: transaction.id });
          setDiscardConfirmOpen(false);
        }}
      />

      <ConfirmationDialog
        open={undoConfirmOpen}
        title="Desfazer conciliação"
        description="A transação volta para Pendentes e o vínculo com o(s) lançamento(s) é removido. O(s) lançamento(s) em si não são alterados."
        confirmLabel="Desfazer"
        confirmColor="error"
        loading={undoMutation.isPending}
        onCancel={() => setUndoConfirmOpen(false)}
        onConfirm={async () => {
          await undoMutation.mutateAsync({ bankStatementId, transactionId: transaction.id });
          setUndoConfirmOpen(false);
        }}
      />
    </Card>
  );
}
