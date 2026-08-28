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
} from "@/ui";
import {
  SERVICE_ORDER_STATUS_BASE_TYPE_LABELS,
  SERVICE_ORDER_STATUS_BASE_TYPE_ORDER,
} from "@/features/service-orders/types/service-order-status";
import type {
  ServiceOrderStatus,
  ServiceOrderStatusBaseType,
  ServiceOrderStatusFormValues,
} from "@/features/service-orders/types/service-order-status";

const VARIANT_OPTIONS: {
  value: ServiceOrderStatus["variant"];
  label: string;
}[] = [
  { value: "default", label: "Destaque" },
  { value: "secondary", label: "Secundário" },
  { value: "outline", label: "Contorno" },
  { value: "destructive", label: "Alerta" },
];

const FORM_ID = "service-order-status-form";

type ServiceOrderStatusFormPanelProps = {
  mode: "create" | "edit";
  initialValues: ServiceOrderStatusFormValues;
  formKey: string;
  onCancel: () => void;
  onSave: (values: ServiceOrderStatusFormValues) => void;
};

/**
 * Formulário inline (sem Dialog) — evita conflito de foco com o Drawer pai.
 * Espelha o painel de status de Contratos + campo Etapa (`baseType`).
 */
export function ServiceOrderStatusFormPanel({
  mode,
  initialValues,
  formKey,
  onCancel,
  onSave,
}: ServiceOrderStatusFormPanelProps) {
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
            O tipo-base define em qual aba da listagem a OS aparece.
          </Typography>
        </Box>
      </Stack>

      <ServiceOrderStatusFormBody
        key={formKey}
        initialValues={initialValues}
        onSave={onSave}
        onCancel={onCancel}
      />
    </Box>
  );
}

function ServiceOrderStatusFormBody({
  initialValues,
  onSave,
  onCancel,
}: {
  initialValues: ServiceOrderStatusFormValues;
  onSave: (values: ServiceOrderStatusFormValues) => void;
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
            id="so-status-name"
            label="Nome"
            value={values.name}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="Ex.: Aguardando peça"
            autoFocus
          />

          <FormControl fullWidth>
            <InputLabel id="so-status-base-type-label">
              Etapa (tipo-base)
            </InputLabel>
            <Select
              labelId="so-status-base-type-label"
              id="so-status-base-type"
              label="Etapa (tipo-base)"
              value={values.baseType}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  baseType: event.target.value as ServiceOrderStatusBaseType,
                }))
              }
            >
              {SERVICE_ORDER_STATUS_BASE_TYPE_ORDER.map((baseType) => (
                <MenuItem key={baseType} value={baseType}>
                  {SERVICE_ORDER_STATUS_BASE_TYPE_LABELS[baseType]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: -1.5 }}>
            As abas da listagem e os relatórios agrupam pelas etapas — assim
            status personalizados nunca quebram a navegação.
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="so-status-variant-label">
              Aparência do badge
            </InputLabel>
            <Select
              labelId="so-status-variant-label"
              id="so-status-variant"
              label="Aparência do badge"
              value={values.variant}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  variant: event.target
                    .value as ServiceOrderStatus["variant"],
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
              bgcolor: "background.paper",
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
                Status inativos não aparecem no select de novas OSs.
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
