"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { Button, Drawer, Input, ScrollArea, Select, Stack } from "@/ui";
import { useChartOfAccountOptionsQuery } from "@/features/chart-of-accounts/hooks/use-chart-of-account-options-query";
import { useCostCenterOptionsQuery } from "@/features/cost-centers/hooks/use-cost-center-options-query";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import {
  formatCurrencyBRL,
  formatIsoDateBR,
} from "@/features/bank-reconciliation/lib/bank-statement-format";
import type {
  BankStatementTransaction,
  CreateEntryFromTransactionInput,
} from "@/features/bank-reconciliation/types/bank-statement";

type CreateEntryFromTransactionDrawerProps = {
  open: boolean;
  transaction: BankStatementTransaction;
  /** Conta bancária do extrato — pré-seleciona o campo Conta, mas ele
   *  continua editável (research.md D14, `null` quando o extrato não
   *  resolveu uma conta). */
  defaultBankAccountId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: CreateEntryFromTransactionInput) => void;
  isSaving: boolean;
};

/**
 * Formulário de "Novo Registro" a partir de uma transação pendente (US5,
 * FR-018/FR-040) — seções Transação Financeira / Dados de pagamento /
 * Classificação, mesmo agrupamento do layout de referência. Valor, taxas/
 * despesas, multas/juros, total e datas vêm da transação e aparecem como
 * somente leitura — só conta, categoria e centro de custo são editáveis.
 * Sem rateio múltiplo (fora de escopo, FR-040).
 */
export function CreateEntryFromTransactionDrawer({
  open,
  transaction,
  defaultBankAccountId,
  onOpenChange,
  onConfirm,
  isSaving,
}: CreateEntryFromTransactionDrawerProps) {
  return (
    <Drawer open={open} onClose={() => onOpenChange(false)} title="Novo Registro" width={640}>
      <CreateEntryFromTransactionDrawerBody
        key={transaction.id}
        transaction={transaction}
        defaultBankAccountId={defaultBankAccountId}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        isSaving={isSaving}
      />
    </Drawer>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

function CreateEntryFromTransactionDrawerBody({
  transaction,
  defaultBankAccountId,
  onOpenChange,
  onConfirm,
  isSaving,
}: {
  transaction: BankStatementTransaction;
  defaultBankAccountId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: CreateEntryFromTransactionInput) => void;
  isSaving: boolean;
}) {
  const [description, setDescription] = useState(transaction.memo);
  const [partyName, setPartyName] = useState("");
  const [note, setNote] = useState("");
  const [bankAccountId, setBankAccountId] = useState(defaultBankAccountId ?? "");
  const [chartOfAccountId, setChartOfAccountId] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const { data: bankAccounts = [] } = useBankAccountOptionsQuery();
  const { data: categories = [] } = useChartOfAccountOptionsQuery();
  const { data: costCenters = [] } = useCostCenterOptionsQuery();

  const isValid = Boolean(bankAccountId && chartOfAccountId && costCenterId);
  const dateLabel = formatIsoDateBR(transaction.postedAt);
  const amountLabel = formatCurrencyBRL(transaction.amount);

  return (
    <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Data, valor e tipo vêm da transação do extrato e não podem ser
          alterados — o lançamento já nasce conciliado com ela.
        </Typography>

        <Box sx={{ display: "grid", gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Transação Financeira
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 2,
                mb: 2,
                p: 2,
                borderRadius: 1,
                bgcolor: "action.hover",
              }}
            >
              <ReadOnlyField label="Valor" value={amountLabel} />
              <ReadOnlyField label="Taxas/Despesas" value={formatCurrencyBRL(0)} />
              <ReadOnlyField label="Multas/Juros" value={formatCurrencyBRL(0)} />
              <ReadOnlyField label="Total" value={amountLabel} />
              <ReadOnlyField label="Data de Competência" value={dateLabel} />
              <ReadOnlyField label="Data de Vencimento" value={dateLabel} />
            </Box>
            <FormControl fullWidth error={!bankAccountId}>
              <InputLabel id="create-entry-bank-account-label">Conta</InputLabel>
              <Select
                labelId="create-entry-bank-account-label"
                label="Conta"
                value={bankAccountId}
                onChange={(event) => setBankAccountId(event.target.value as string)}
              >
                <MenuItem value="">
                  <em>Selecione uma opção</em>
                </MenuItem>
                {bankAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                Descrição
              </Typography>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                fullWidth
                autoFocus
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Dados de pagamento
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 2,
                p: 2,
                borderRadius: 1,
                bgcolor: "action.hover",
              }}
            >
              <ReadOnlyField label="Valor" value={amountLabel} />
              <ReadOnlyField label="Data do pagamento" value={dateLabel} />
              <ReadOnlyField label="Método de pagamento" value="—" />
              <ReadOnlyField label="Bandeira" value="—" />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Classificação
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
              <FormControl fullWidth error={!chartOfAccountId}>
                <InputLabel id="create-entry-category-label">Categoria</InputLabel>
                <Select
                  labelId="create-entry-category-label"
                  label="Categoria"
                  value={chartOfAccountId}
                  onChange={(event) => setChartOfAccountId(event.target.value as string)}
                >
                  <MenuItem value="">
                    <em>Selecione uma opção</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth error={!costCenterId}>
                <InputLabel id="create-entry-cost-center-label">Centro de custo</InputLabel>
                <Select
                  labelId="create-entry-cost-center-label"
                  label="Centro de custo"
                  value={costCenterId}
                  onChange={(event) => setCostCenterId(event.target.value as string)}
                >
                  <MenuItem value="">
                    <em>Selecione uma opção</em>
                  </MenuItem>
                  {costCenters.map((center) => (
                    <MenuItem key={center.id} value={center.id}>
                      {center.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Cliente ou fornecedor
            </Typography>
            <Input
              value={partyName}
              onChange={(event) => setPartyName(event.target.value)}
              fullWidth
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Observação
            </Typography>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </Box>
        </Box>
      </ScrollArea>
      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <Button type="button" variant="outlined" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!isValid || isSaving}
          loading={isSaving}
          onClick={() =>
            onConfirm({
              description,
              partyName,
              categoryName: "",
              note,
              bankAccountId,
              chartOfAccountId,
              costCenterId,
            })
          }
        >
          Salvar
        </Button>
      </Stack>
    </Stack>
  );
}
