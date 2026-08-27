"use client";

import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  FormControlLabel,
  SearchInput,
  Stack,
  Typography,
} from "@/ui";
import { formatProductPrice } from "@/features/products/services/product-list.service";
import type { Product } from "@/features/products/types/product";

type PriceListAddProductsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableProducts: Product[];
  onConfirm: (productIds: string[]) => void;
};

function matchesSearch(product: Product, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    product.name.toLowerCase().includes(q) ||
    product.sku.toLowerCase().includes(q)
  );
}

export function PriceListAddProductsDrawer({
  open,
  onOpenChange,
  availableProducts,
  onConfirm,
}: PriceListAddProductsDrawerProps) {
  if (!open) {
    return (
      <Drawer
        open={false}
        onClose={() => onOpenChange(false)}
        title="Gerenciar produtos"
        width={520}
      >
        {null}
      </Drawer>
    );
  }

  return (
    <PriceListAddProductsDrawerSession
      availableProducts={availableProducts}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}

type SessionProps = {
  availableProducts: Product[];
  onOpenChange: (open: boolean) => void;
  onConfirm: (productIds: string[]) => void;
};

function PriceListAddProductsDrawerSession({
  availableProducts,
  onOpenChange,
  onConfirm,
}: SessionProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const visible = useMemo(
    () => availableProducts.filter((product) => matchesSearch(product, search)),
    [availableProducts, search],
  );

  const allVisibleSelected =
    visible.length > 0 && visible.every((product) => selected.has(product.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const product of visible) next.delete(product.id);
        return next;
      }
      const next = new Set(prev);
      for (const product of visible) next.add(product.id);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...selected]);
    onOpenChange(false);
  }

  return (
    <Drawer
      open
      onClose={() => onOpenChange(false)}
      title="Gerenciar produtos"
      width={520}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            Adicionar
            {selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
        Selecione os produtos que farão parte desta lista de preços.
      </Typography>
      <SearchInput
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar produto por nome ou SKU…"
        sx={{ mb: 1.5 }}
      />
      {visible.length > 0 ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={allVisibleSelected}
              onChange={() => toggleAllVisible()}
            />
          }
          label={`Selecionar todos (${visible.length})`}
          sx={{ mb: 1 }}
        />
      ) : null}
      <Stack
        divider={
          <Box sx={{ borderBottom: 1, borderColor: "divider" }} />
        }
        sx={{ mx: -1 }}
      >
        {visible.length > 0 ? (
          visible.map((product) => (
            <Box
              key={product.id}
              component="label"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 1,
                py: 1.5,
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Checkbox
                checked={selected.has(product.id)}
                onChange={() => toggle(product.id)}
                slotProps={{
                  input: { "aria-label": `Selecionar ${product.name}` },
                }}
              />
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderRadius: 1,
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "action.hover",
                }}
              >
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Inventory2Outlined sx={{ fontSize: 16, color: "text.secondary" }} />
                )}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {product.name}
                </Typography>
                <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
                  {product.sku}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", flexShrink: 0 }}>
                {formatProductPrice(product.basePrice)}
              </Typography>
            </Box>
          ))
        ) : (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", textAlign: "center", py: 5 }}
          >
            {availableProducts.length === 0
              ? "Todos os produtos já estão na lista."
              : "Nenhum produto encontrado."}
          </Typography>
        )}
      </Stack>
    </Drawer>
  );
}
