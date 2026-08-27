"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Drawer, Switch, FormControlLabel } from "@/ui";
import {
  areAvailabilityEqual,
  createDefaultAvailability,
  type ProductAvailability,
} from "@/features/products/data/product-availability";
import type { ProductType } from "@/features/products/types/product";

type ProductAvailabilityDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProductAvailability;
  onSave: (next: ProductAvailability) => void;
  productType?: ProductType | "";
};

function ProductAvailabilityDrawerBody({
  value,
  onSave,
  onOpenChange,
  productType,
}: {
  value: ProductAvailability;
  onSave: (next: ProductAvailability) => void;
  onOpenChange: (open: boolean) => void;
  productType?: ProductType | "";
}) {
  const [draft, setDraft] = useState<ProductAvailability>(value);

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
          <Button
            type="button"
            variant="text"
            onClick={() => onOpenChange(false)}
          >
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
          Defina se o produto pode ser vendido pelo ERP.
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

        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={() => setDraft(createDefaultAvailability(productType))}
          sx={{ alignSelf: "flex-start" }}
        >
          Restaurar padrão
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
  productType,
}: ProductAvailabilityDrawerProps) {
  if (!open) return null;
  return (
    <ProductAvailabilityDrawerBody
      value={value}
      onSave={onSave}
      onOpenChange={onOpenChange}
      productType={productType}
    />
  );
}
