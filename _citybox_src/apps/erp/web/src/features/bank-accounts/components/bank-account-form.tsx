"use client";

import ChevronRight from "@mui/icons-material/ChevronRight";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  CurrencyInput,
  DatePicker,
  FormField,
  Select,
  toast,
} from "@citybox/mui";
import { BANK_CATALOG } from "@/features/bank-accounts/lib/bank-catalog";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";
import type { BankAccountFormValues } from "@/features/bank-accounts/types/bank-account";

type BankAccountFormProps = {
  formId: string;
  onSubmit: (values: BankAccountFormValues) => void;
  initialValues?: BankAccountFormValues;
  disabled?: boolean;
};

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function BankAccountForm({
  formId,
  onSubmit,
  initialValues,
  disabled = false,
}: BankAccountFormProps) {
  const units = useBranchUnits();
  const [unitsDrawerOpen, setUnitsDrawerOpen] = useState(false);
  const [bankCode, setBankCode] = useState(initialValues?.bankCode ?? "");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [initialBalance, setInitialBalance] = useState(
    initialValues?.initialBalance ?? 0,
  );
  const [openedAt, setOpenedAt] = useState(
    () => initialValues?.openedAt ?? toIsoDate(new Date()),
  );
  const [unitIds, setUnitIds] = useState<string[]>(
    initialValues?.unitIds ?? [],
  );

  function handleSubmit() {
    if (!bankCode) {
      toast.error("Selecione o banco da conta.");
      return;
    }
    if (!openedAt) {
      toast.error("Informe a data de abertura.");
      return;
    }
    if (unitIds.length === 0) {
      toast.error("Vincule ao menos uma unidade à conta.");
      return;
    }

    onSubmit({ bankCode, name, initialBalance, openedAt, unitIds });
  }

  return (
    <Box
      component="form"
      id={formId}
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        A conta é virtual: espelha a conta real da empresa para controlar saldos
        e movimentações. A conciliação é feita importando o extrato OFX do
        banco.
      </Typography>

      <Stack spacing={2.5}>
        <FormControl fullWidth disabled={disabled}>
          <InputLabel id="ba-bank-label">Banco</InputLabel>
          <Select
            labelId="ba-bank-label"
            id="ba-bank"
            label="Banco"
            value={bankCode}
            onChange={(event) => setBankCode(event.target.value as string)}
          >
            {BANK_CATALOG.map((bank) => (
              <MenuItem key={bank.code} value={bank.code}>
                {bank.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box>
          <FormField
            id="ba-name"
            label="Apelido da conta (opcional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Conta corrente — matriz"
            helperText="Sem apelido, a conta usa o nome do banco."
            disabled={disabled}
          />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Saldo inicial
          </Typography>
          <CurrencyInput
            id="ba-initial-balance"
            value={initialBalance}
            onValueChange={setInitialBalance}
            disabled={disabled}
          />
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", mt: 0.5, display: "block" }}
          >
            O valor que a empresa já tem no banco físico ao começar a usar o
            sistema — entra como primeiro registro da conta.
          </Typography>
        </Box>

        <DatePicker
          label="Data de abertura"
          value={parseIsoDate(openedAt)}
          onChange={(date) => {
            if (date) setOpenedAt(toIsoDate(date));
          }}
          disabled={disabled}
        />

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Vinculação de empresas (unidades)
          </Typography>
          <Box
            role="button"
            tabIndex={0}
            onClick={() => setUnitsDrawerOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setUnitsDrawerOpen(true);
              }
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              width: "100%",
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.default",
              px: 2,
              py: 1.5,
              cursor: "pointer",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Escolha em quais unidades usar esta conta
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {unitIds.length} de {units.length} unidades selecionadas
              </Typography>
            </Box>
            <Button
              type="button"
              variant="outlined"
              onClick={(event) => {
                event.stopPropagation();
                setUnitsDrawerOpen(true);
              }}
              endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
            >
              Selecionar
            </Button>
          </Box>
        </Box>
      </Stack>

      <ProductUnitsDrawer
        units={units}
        open={unitsDrawerOpen}
        onOpenChange={setUnitsDrawerOpen}
        selectedUnitIds={unitIds}
        onSave={setUnitIds}
      />
    </Box>
  );
}
