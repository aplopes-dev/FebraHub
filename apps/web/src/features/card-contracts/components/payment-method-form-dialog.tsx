"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import MenuItem from "@mui/material/MenuItem";
import {
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  NumberSpinner,
  Radio,
  RadioGroup,
  Select,
} from "@/ui";
import type {
  PaymentMethod,
  PaymentMethodType,
  ProgressiveRateTier,
} from "@/features/card-contracts/types/card-contract";
import { CARD_BRAND_OPTIONS } from "@/features/card-contracts/data/card-brands";

const PAYMENT_TYPE_OPTIONS = [
  { value: "pix" as PaymentMethodType, label: "Pix" },
  { value: "debit" as PaymentMethodType, label: "Cartão de Débito" },
  { value: "credit" as PaymentMethodType, label: "Cartão de Crédito" },
];

let progressiveTierSeq = 0;

function createEmptyTier(): ProgressiveRateTier {
  progressiveTierSeq += 1;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `00000000-0000-4000-8000-${String(progressiveTierSeq).padStart(12, "0")}`;
  return {
    id,
    minInstallments: 1,
    maxInstallments: 1,
    rate: 0,
  };
}

const DEFAULT_VALUES: {
  type: PaymentMethodType;
  brand: string;
  rate: number;
  fee: number;
  settlementDays: number;
  minInstallments: number;
  maxInstallments: number;
  firstPaymentDays: number;
  daysBetweenInstallments: number;
  progressiveEnabled: boolean;
  progressiveTiers: ProgressiveRateTier[];
} = {
  type: "credit",
  brand: "",
  rate: 0,
  fee: 0,
  settlementDays: 0,
  minInstallments: 1,
  maxInstallments: 1,
  firstPaymentDays: 30,
  daysBetweenInstallments: 30,
  progressiveEnabled: false,
  progressiveTiers: [],
};

type PaymentMethodFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (method: Omit<PaymentMethod, "id">) => void;
  method?: PaymentMethod;
  formKey?: string;
  isSaving?: boolean;
};

export function PaymentMethodFormDialog({
  open,
  onClose,
  onSave,
  method,
  formKey = "default",
  isSaving = false,
}: PaymentMethodFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <PaymentMethodFormDialogBody
        key={formKey}
        onClose={onClose}
        onSave={onSave}
        method={method}
        isSaving={isSaving}
      />
    </Dialog>
  );
}

function PaymentMethodFormDialogBody({
  onClose,
  onSave,
  method,
  isSaving,
}: {
  onClose: () => void;
  onSave: (method: Omit<PaymentMethod, "id">) => void;
  method?: PaymentMethod;
  isSaving: boolean;
}) {
  const [values, setValues] = useState(() =>
    method
      ? {
          type: method.type,
          brand: method.brand ?? "",
          rate: method.rate ?? 0,
          fee: method.fee ?? 0,
          settlementDays: method.settlementDays ?? 0,
          minInstallments: method.minInstallments ?? 1,
          maxInstallments: method.maxInstallments ?? 1,
          firstPaymentDays: method.firstPaymentDays ?? 30,
          daysBetweenInstallments: method.daysBetweenInstallments ?? 30,
          progressiveEnabled: method.progressiveEnabled ?? false,
          progressiveTiers: method.progressiveTiers ?? [],
        }
      : { ...DEFAULT_VALUES },
  );

  function setField<K extends keyof typeof values>(
    key: K,
    value: (typeof values)[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    const payload: Omit<PaymentMethod, "id"> = {
      type: values.type,
      brand: values.type !== "pix" ? values.brand : null,
      rate: values.rate,
      fee: values.type !== "credit" ? values.fee : null,
      settlementDays: values.type !== "credit" ? values.settlementDays : null,
      minInstallments: values.type === "credit" ? values.minInstallments : null,
      maxInstallments: values.type === "credit" ? values.maxInstallments : null,
      firstPaymentDays: values.type === "credit" ? values.firstPaymentDays : null,
      daysBetweenInstallments:
        values.type === "credit" ? values.daysBetweenInstallments : null,
      progressiveEnabled:
        values.type === "credit" ? values.progressiveEnabled : false,
      progressiveTiers:
        values.type === "credit" && values.progressiveEnabled
          ? values.progressiveTiers
          : [],
    };

    onSave(payload);
  }

  function addTier() {
    setValues((prev) => ({
      ...prev,
      progressiveTiers: [...prev.progressiveTiers, createEmptyTier()],
    }));
  }

  function updateTier(id: string, field: keyof ProgressiveRateTier, value: number) {
    setValues((prev) => ({
      ...prev,
      progressiveTiers: prev.progressiveTiers.map((t) =>
        t.id === id ? { ...t, [field]: value } : t,
      ),
    }));
  }

  function removeTier(id: string) {
    setValues((prev) => ({
      ...prev,
      progressiveTiers: prev.progressiveTiers.filter((t) => t.id !== id),
    }));
  }

  const isCredit = values.type === "credit";

  return (
    <>
      <DialogTitle>
        {method ? "Editar método" : "Novo método de pagamento"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl component="fieldset">
            <FormLabel
              component="legend"
              sx={{ fontWeight: 500, fontSize: "0.875rem", mb: 1 }}
            >
              Tipo
            </FormLabel>
            <RadioGroup
              value={values.type}
              onChange={(event) =>
                setField("type", event.target.value as PaymentMethodType)
              }
              row
            >
              {PAYMENT_TYPE_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.value}
                  value={opt.value}
                  control={<Radio size="small" />}
                  label={opt.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {values.type !== "pix" && (
            <FormControl fullWidth>
              <FormLabel
                sx={{ fontWeight: 500, fontSize: "0.875rem", mb: 0.5 }}
              >
                Bandeira
              </FormLabel>
              <Select
                value={values.brand}
                onChange={(event) =>
                  setField("brand", event.target.value as string)
                }
                displayEmpty
              >
                <MenuItem value="" disabled>
                  Selecione a bandeira
                </MenuItem>
                {CARD_BRAND_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!isCredit ? (
            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <FormLabel
                  sx={{ display: "block", fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}
                >
                  Taxa (%)
                </FormLabel>
                <NumberSpinner
                  id="pm-rate"
                  value={values.rate}
                  min={0}
                  max={100}
                  step={0.1}
                  onValueChange={(value) =>
                    setField("rate", value ?? 0)
                  }
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FormLabel
                  sx={{ display: "block", fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}
                >
                  Tarifa
                </FormLabel>
                <CurrencyInput
                  placeholder="R$ 0,00"
                  value={values.fee}
                  onValueChange={(value) =>
                    setField("fee", value ?? 0)
                  }
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FormLabel
                  sx={{ display: "block", fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}
                >
                  Dias para repasse
                </FormLabel>
                <NumberSpinner
                  id="pm-settlement"
                  value={values.settlementDays}
                  min={0}
                  step={1}
                  onValueChange={(value) =>
                    setField("settlementDays", value ?? 0)
                  }
                />
              </Box>
            </Stack>
          ) : (
            <Box sx={{ maxWidth: 240 }}>
              <FormLabel
                sx={{ display: "block", fontSize: "0.875rem", fontWeight: 500, mb: 0.5 }}
              >
                Taxa (%)
              </FormLabel>
              <NumberSpinner
                id="pm-rate"
                value={values.rate}
                min={0}
                max={100}
                step={0.1}
                onValueChange={(value) =>
                  setField("rate", value ?? 0)
                }
              />
            </Box>
          )}

          {isCredit && (
            <>
              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <NumberSpinner
                    id="pm-min-installments"
                    label="Parcelas mínimas"
                    value={values.minInstallments}
                    min={1}
                    step={1}
                    onValueChange={(value) =>
                      setField("minInstallments", value ?? 1)
                    }
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <NumberSpinner
                    id="pm-max-installments"
                    label="Parcelas máximas"
                    value={values.maxInstallments}
                    min={values.minInstallments}
                    step={1}
                    onValueChange={(value) =>
                      setField(
                        "maxInstallments",
                        Math.max(value ?? values.minInstallments, values.minInstallments),
                      )
                    }
                  />
                </Box>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <NumberSpinner
                    id="pm-first-payment-days"
                    label="Dias 1º pagamento"
                    value={values.firstPaymentDays}
                    min={0}
                    step={1}
                    onValueChange={(value) =>
                      setField("firstPaymentDays", value ?? 0)
                    }
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <NumberSpinner
                    id="pm-days-between"
                    label="Dias entre parcelas"
                    value={values.daysBetweenInstallments}
                    min={1}
                    step={1}
                    onValueChange={(value) =>
                      setField("daysBetweenInstallments", value ?? 30)
                    }
                  />
                </Box>
              </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={values.progressiveEnabled}
                    onChange={(event) =>
                      setField("progressiveEnabled", event.target.checked)
                    }
                  />
                }
                label="Aplicar taxa de forma progressiva"
              />

              {values.progressiveEnabled && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: 1,
                    borderColor: "divider",
                    bgcolor: "action.hover",
                  }}
                >
                  <Stack spacing={2}>
                    <Box
                      component="header"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <FormLabel
                        component="span"
                        sx={{ fontWeight: 500, fontSize: "0.875rem" }}
                      >
                        Faixas de taxa progressiva
                      </FormLabel>
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        onClick={addTier}
                      >
                        + Adicionar faixa
                      </Button>
                    </Box>

                    {values.progressiveTiers.map((tier, index) => (
                      <Stack
                        key={tier.id}
                        direction="row"
                        spacing={1.5}
                        sx={{ alignItems: "flex-end" }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <NumberSpinner
                            id={`tier-min-${tier.id}`}
                            label="De (parcelas)"
                            value={tier.minInstallments}
                            min={1}
                            step={1}
                            onValueChange={(value) =>
                              updateTier(tier.id, "minInstallments", value ?? 1)
                            }
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <NumberSpinner
                            id={`tier-max-${tier.id}`}
                            label="Até (parcelas)"
                            value={tier.maxInstallments}
                            min={tier.minInstallments}
                            step={1}
                            onValueChange={(value) =>
                              updateTier(
                                tier.id,
                                "maxInstallments",
                                Math.max(value ?? tier.minInstallments, tier.minInstallments),
                              )
                            }
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <NumberSpinner
                            id={`tier-rate-${tier.id}`}
                            label="Taxa (%)"
                            value={tier.rate}
                            min={0}
                            max={100}
                            step={0.1}
                            onValueChange={(value) =>
                              updateTier(tier.id, "rate", value ?? 0)
                            }
                          />
                        </Box>
                        <Button
                          type="button"
                          variant="text"
                          color="error"
                          onClick={() => removeTier(tier.id)}
                          sx={{ minWidth: 32, mb: 0.5 }}
                          aria-label={`Remover faixa ${index + 1}`}
                        >
                          ×
                        </Button>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          onClick={handleSave}
          loading={isSaving}
          disabled={
            isSaving || (values.type !== "pix" && !values.brand.trim())
          }
        >
          {method ? "Salvar alterações" : "Adicionar método"}
        </Button>
      </DialogActions>
    </>
  );
}
