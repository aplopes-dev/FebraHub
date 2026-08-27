"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  Button,
  Checkbox,
  Drawer,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@/ui";
import { useProductCategoriesQuery } from "@/features/products/hooks/use-product-queries";
import {
  PRODUCT_FILTER_CHANNEL_OPTIONS,
  PRODUCT_STOCK_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
  PRODUCT_VARIANTS_OPTIONS,
  createEmptyProductFilters,
} from "@/features/products/lib/product-filters";
import type {
  ProductListFilters,
  ProductStockFilter,
  ProductVariantsFilter,
} from "@/features/products/types/product";

type ProductFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ProductListFilters;
  onApply: (filters: ProductListFilters) => void;
};

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

export function ProductFiltersDrawer({
  open,
  onOpenChange,
  value,
  onApply,
}: ProductFiltersDrawerProps) {
  if (!open) return null;
  return (
    <ProductFiltersDrawerBody
      value={value}
      onApply={onApply}
      onOpenChange={onOpenChange}
    />
  );
}

function ProductFiltersDrawerBody({
  value,
  onApply,
  onOpenChange,
}: {
  value: ProductListFilters;
  onApply: (filters: ProductListFilters) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<ProductListFilters>(value);
  const categoriesQuery = useProductCategoriesQuery();
  const categories = categoriesQuery.data ?? [];

  function handleClear() {
    setDraft(createEmptyProductFilters());
  }

  function handleApply() {
    onApply(draft);
    onOpenChange(false);
  }

  return (
    <Drawer
      open
      onClose={() => onOpenChange(false)}
      title="Filtros"
      width={400}
      footer={
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "flex-end",
          }}
        >
          <Button type="button" variant="outlined" onClick={handleClear}>
            Limpar
          </Button>
          <Button type="button" variant="contained" onClick={handleApply}>
            Aplicar filtro
          </Button>
        </Stack>
      }
    >
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 3,
        }}
      >
        Refine a listagem de produtos por tipo, estoque e mais.
      </Typography>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Tipo de produto
          </Typography>
          <Stack spacing={0.5}>
            {PRODUCT_TYPE_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={draft.types.includes(option.value)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        types: toggleInList(current.types, option.value),
                      }))
                    }
                  />
                }
                label={option.label}
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Estoque
          </Typography>
          <RadioGroup
            value={draft.stock}
            onChange={(_, next) =>
              setDraft((current) => ({
                ...current,
                stock: next as ProductStockFilter,
              }))
            }
          >
            {PRODUCT_STOCK_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Variações
          </Typography>
          <RadioGroup
            value={draft.variants}
            onChange={(_, next) =>
              setDraft((current) => ({
                ...current,
                variants: next as ProductVariantsFilter,
              }))
            }
          >
            {PRODUCT_VARIANTS_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Categoria
          </Typography>
          <Stack spacing={0.5}>
            {categoriesQuery.isLoading ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Carregando categorias…
              </Typography>
            ) : categories.length === 0 ? (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Nenhuma categoria cadastrada.
              </Typography>
            ) : (
              categories.map((category) => (
                <FormControlLabel
                  key={category.id}
                  control={
                    <Checkbox
                      checked={draft.categories.includes(category.id)}
                      onChange={() =>
                        setDraft((current) => ({
                          ...current,
                          categories: toggleInList(
                            current.categories,
                            category.id,
                          ),
                        }))
                      }
                    />
                  }
                  label={category.name}
                />
              ))
            )}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Canal de venda
          </Typography>
          <Stack spacing={0.5}>
            {PRODUCT_FILTER_CHANNEL_OPTIONS.map((channel) => (
              <FormControlLabel
                key={channel.id}
                control={
                  <Checkbox
                    checked={draft.channels.includes(channel.id)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        channels: toggleInList(current.channels, channel.id),
                      }))
                    }
                  />
                }
                label={channel.name}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );
}
