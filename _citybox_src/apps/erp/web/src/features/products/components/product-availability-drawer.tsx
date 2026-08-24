"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Drawer, Switch, FormControlLabel } from "@citybox/mui";
import {
  areAvailabilityEqual,
  createDefaultAvailability,
  type ProductAvailability,
} from "@/features/products/data/product-availability";
import { usePosTerminalsQuery } from "@/features/pos-registers/hooks/use-pos-terminal-queries";

type ProductAvailabilityDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProductAvailability;
  onSave: (next: ProductAvailability) => void;
};

function ProductAvailabilityDrawerBody({
  value,
  onSave,
  onOpenChange,
}: {
  value: ProductAvailability;
  onSave: (next: ProductAvailability) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<ProductAvailability>(value);
  const terminalsQuery = usePosTerminalsQuery({
    search: "",
    page: 1,
    perPage: 50,
  });
  const terminals = (terminalsQuery.data?.data ?? []).filter(
    (terminal) => !terminal.deletedAt && terminal.status === "active",
  );

  function handleSave() {
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Drawer
      open
      onClose={() => onOpenChange(false)}
      title="Disponibilidade"
      width={480}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="text" onClick={() => onOpenChange(false)}>
            Descartar alterações
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={areAvailabilityEqual(draft, value)}
            onClick={handleSave}
          >
            Salvar
          </Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Defina onde o produto pode ser vendido. No PDV, o flag vale para todos
          os terminais da unidade.
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={draft.availableOnErp}
              onChange={(_, checked) =>
                setDraft((current) => ({
                  ...current,
                  availableOnErp: checked,
                }))
              }
            />
          }
          label="Disponível no ERP"
        />

        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={draft.availableOnPdv}
                onChange={(_, checked) =>
                  setDraft((current) => ({
                    ...current,
                    availableOnPdv: checked,
                  }))
                }
              />
            }
            label="Disponível no PDV"
          />
          <Typography
            variant="caption"
            sx={{ display: "block", color: "text.secondary", mt: 0.5, ml: 6 }}
          >
            Produtos desmarcados não aparecem no catálogo do aplicativo PDV.
          </Typography>

          <Box sx={{ mt: 2, pl: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Terminais desta unidade
            </Typography>
            {terminalsQuery.isLoading ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Carregando terminais…
              </Typography>
            ) : terminals.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nenhum ponto de venda ativo cadastrado nesta unidade.
              </Typography>
            ) : (
              <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
                {terminals.map((terminal) => (
                  <Typography
                    component="li"
                    key={terminal.id}
                    variant="body2"
                    sx={{ color: "text.secondary" }}
                  >
                    {terminal.name}
                    {terminal.paired ? " · pareado" : ""}
                  </Typography>
                ))}
              </Stack>
            )}
          </Box>
        </Box>

        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={() => setDraft(createDefaultAvailability())}
          sx={{ alignSelf: "flex-start" }}
        >
          Restaurar padrões (ambos ativos)
        </Button>
      </Stack>
    </Drawer>
  );
}

export function ProductAvailabilityDrawer({
  open,
  onOpenChange,
  value,
  onSave,
}: ProductAvailabilityDrawerProps) {
  if (!open) return null;
  return (
    <ProductAvailabilityDrawerBody
      value={value}
      onSave={onSave}
      onOpenChange={onOpenChange}
    />
  );
}
