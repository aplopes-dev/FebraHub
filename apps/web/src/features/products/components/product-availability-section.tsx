"use client";

import EditOutlined from "@mui/icons-material/EditOutlined";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@/ui";
import { ProductAvailabilityDrawer } from "@/features/products/components/product-availability-drawer";
import type { ProductAvailability } from "@/features/products/data/product-availability";
import type { ProductType } from "@/features/products/types/product";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";

type ProductAvailabilitySectionProps = {
  value: ProductAvailability;
  onChange: (next: ProductAvailability) => void;
  productType?: ProductType | "";
};

const CHANNELS = [
  {
    key: "erp" as const,
    label: "ERP",
    description: "Pedidos e vendas no backoffice",
    enabled: (value: ProductAvailability) => value.availableOnErp,
  },
];

export function ProductAvailabilitySection({
  value,
  onChange,
  productType,
}: ProductAvailabilitySectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Box component="section" sx={productFormSectionGridSx}>
        <Box component="header" sx={productFormSectionHeaderSx}>
          <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
            Disponibilidade
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Configure onde o produto estará disponível para vendas.
          </Typography>
        </Box>

        <Box
          sx={{
            ...productFormSectionBoxSx,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Stack
            component="ul"
            spacing={1.5}
            sx={{ minWidth: 0, flex: 1, m: 0, p: 0, listStyle: "none" }}
          >
            {CHANNELS.map((channel) => {
              const available = channel.enabled(value);
              return (
                <Box
                  component="li"
                  key={channel.key}
                  sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      mt: 0.75,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      flexShrink: 0,
                      bgcolor: available ? "success.main" : "warning.main",
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {channel.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                      {available ? "Disponível" : "Indisponível"} ·{" "}
                      {channel.description}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>

          <Button
            type="button"
            variant="outlined"
            size="small"
            startIcon={<EditOutlined sx={{ fontSize: 16 }} />}
            onClick={() => setDrawerOpen(true)}
          >
            Editar
          </Button>
        </Box>
      </Box>

      <ProductAvailabilityDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        productType={productType}
        value={value}
        onSave={onChange}
      />
    </>
  );
}
