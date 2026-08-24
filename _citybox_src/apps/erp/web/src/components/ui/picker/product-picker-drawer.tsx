"use client";

import { useMemo, useState } from "react";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  ScrollArea,
  SearchInput,
  Stack,
  Typography,
} from "@citybox/mui";
import { formatProductPrice } from "@/features/products/services/product-list.service";
import type { Product } from "@/features/products/types/product";

export type ProductPickerDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableProducts: Product[];
  onConfirm: (productIds: string[]) => void;
  title?: string;
  description?: string;
  /** Texto extra na linha secundária (ex.: saldo). */
  renderSecondaryMeta?: (product: Product) => string;
};

function matchesSearch(product: Product, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return (
    product.name.toLowerCase().includes(q) ||
    product.sku.toLowerCase().includes(q)
  );
}

export function ProductPickerDrawer({
  open,
  onOpenChange,
  availableProducts,
  onConfirm,
  title = "Adicionar produtos",
  description = "Selecione os produtos desejados.",
  renderSecondaryMeta = (product) =>
    `${product.sku} · Saldo ${product.stock}`,
}: ProductPickerDrawerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => availableProducts.filter((p) => matchesSearch(p, search)),
    [availableProducts, search],
  );

  const allVisibleSelected =
    visible.length > 0 && visible.every((p) => selected.has(p.id));

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
        for (const p of visible) next.delete(p.id);
        return next;
      }
      const next = new Set(prev);
      for (const p of visible) next.add(p.id);
      return next;
    });
  }

  function handleConfirm() {
    onConfirm([...selected]);
    onOpenChange(false);
    setSelected(new Set());
    setSearch("");
  }

  function handleClose() {
    onOpenChange(false);
    setSelected(new Set());
    setSearch("");
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={title}
      width={480}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={selected.size === 0}
            onClick={handleConfirm}
          >
            Adicionar{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
        {description ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        ) : null}
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar produto por nome ou SKU…"
        />
        {visible.length > 0 ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Checkbox
              checked={allVisibleSelected}
              onChange={() => toggleAllVisible()}
              slotProps={{
                input: { "aria-label": "Selecionar todos os visíveis" },
              }}
            />
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Selecionar todos ({visible.length})
            </Typography>
          </Stack>
        ) : null}
        <ScrollArea sx={{ flex: 1, minHeight: 0, borderTop: 1, borderColor: "divider" }}>
          {visible.length > 0 ? (
            visible.map((product) => (
              <Box
                key={product.id}
                component="label"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1.5,
                  cursor: "pointer",
                  borderBottom: 1,
                  borderColor: "divider",
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
                    <Box
                      component="img"
                      src={product.imageUrl}
                      alt=""
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <ImageOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  )}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {product.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                    {renderSecondaryMeta(product)}
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
              sx={{ color: "text.secondary", textAlign: "center", py: 5, px: 2 }}
            >
              {availableProducts.length === 0
                ? "Todos os produtos já foram adicionados."
                : "Nenhum produto encontrado."}
            </Typography>
          )}
        </ScrollArea>
      </Stack>
    </Drawer>
  );
}
