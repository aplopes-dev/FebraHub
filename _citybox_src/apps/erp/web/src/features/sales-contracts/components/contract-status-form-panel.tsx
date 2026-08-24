"use client";

import { useState, type FormEvent } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  FormField,
  MenuItem,
  Select,
  Switch,
} from "@citybox/mui";
import type {
  ContractStatus,
  ContractStatusFormValues,
} from "@/features/sales-contracts/types/contract-status";

const VARIANT_OPTIONS: {
  value: ContractStatus["variant"];
  label: string;
}[] = [
  { value: "default", label: "Destaque" },
  { value: "secondary", label: "Secundário" },
  { value: "outline", label: "Contorno" },
  { value: "destructive", label: "Alerta" },
];

const FORM_ID = "contract-status-form";

type ContractStatusFormPanelProps = {
  mode: "create" | "edit";
  initialValues: ContractStatusFormValues;
  formKey: string;
  onCancel: () => void;
  onSave: (values: ContractStatusFormValues) => void;
};

/**
 * Formulário inline (sem Dialog) — evita conflito de foco com o Drawer pai.
 */
export function ContractStatusFormPanel({
  mode,
  initialValues,
  formKey,
  onCancel,
  onSave,
}: ContractStatusFormPanelProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        flex: 1,
        mx: -3,
        mt: -3,
        mb: -3,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Button
          type="button"
          variant="text"
          onClick={onCancel}
          aria-label="Voltar para a lista de status"
          sx={{ minWidth: 32, px: 0.5 }}
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
        </Button>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {mode === "create" ? "Novo status" : "Editar status"}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
            Status personalizados organizam visualmente o contrato.
          </Typography>
        </Box>
      </Stack>

      <ContractStatusFormBody
        key={formKey}
        initialValues={initialValues}
        onSave={onSave}
        onCancel={onCancel}
      />
    </Box>
  );
}

function ContractStatusFormBody({
  initialValues,
  onSave,
  onCancel,
}: {
  initialValues: ContractStatusFormValues;
  onSave: (values: ContractStatusFormValues) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initialValues);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(values);
  }

  return (
    <>
      <Box
        component="form"
        id={FORM_ID}
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 3,
          py: 2.5,
        }}
      >
        <Stack spacing={2.5}>
          <FormField
            id="status-name"
            label="Nome"
            value={values.name}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, name: event.target.value }))
            }
            autoFocus
          />

          <FormControl fullWidth>
            <InputLabel id="status-variant-label">
              Aparência do badge
            </InputLabel>
            <Select
              labelId="status-variant-label"
              id="status-variant"
              label="Aparência do badge"
              value={values.variant}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  variant: event.target.value as ContractStatus["variant"],
                }))
              }
            >
              {VARIANT_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              px: 1.5,
              py: 1.25,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Ativo no formulário
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Status inativos não aparecem no select de novos contratos.
              </Typography>
            </Box>
            <Switch
              checked={values.active}
              onChange={(_, checked) =>
                setValues((prev) => ({ ...prev, active: checked }))
              }
            />
          </Stack>
        </Stack>
      </Box>

      <Divider />
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "flex-end", px: 3, py: 2 }}
      >
        <Button type="button" variant="outlined" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" form={FORM_ID} variant="contained">
          Salvar
        </Button>
      </Stack>
    </>
  );
}
