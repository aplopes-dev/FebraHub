"use client";

import Add from "@mui/icons-material/Add";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Autocomplete, Button, FormField } from "@/ui";
import {
  createEmptySupplierRow,
  type ProductSupplierRow,
} from "@/features/products/data/mock-suppliers";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";
import { useActiveSuppliersQuery } from "@/features/suppliers";

type ProductSuppliersSectionProps = {
  value: ProductSupplierRow[];
  onChange: (next: ProductSupplierRow[]) => void;
};

type SupplierOption = {
  id: string;
  name: string;
  document: string;
};

const CONVERSION_TOOLTIP =
  "Conversão é a quantidade de itens contidos em uma caixa (ou embalagem) do fornecedor. Ex.: se a caixa traz 12 unidades, informe 12.";

function updateRow(
  rows: ProductSupplierRow[],
  rowId: string,
  patch: Partial<ProductSupplierRow>,
): ProductSupplierRow[] {
  return rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row));
}

export function ProductSuppliersSection({
  value,
  onChange,
}: ProductSuppliersSectionProps) {
  const suppliersQuery = useActiveSuppliersQuery();
  const supplierOptions = useMemo(
    () =>
      (suppliersQuery.data ?? []).map((supplier) => ({
        id: supplier.id,
        name: supplier.name,
        document: supplier.document,
      })),
    [suppliersQuery.data],
  );

  function handleAddRow() {
    onChange([...value, createEmptySupplierRow()]);
  }

  function handleRemoveRow(rowId: string) {
    if (value.length <= 1) {
      onChange([createEmptySupplierRow()]);
      return;
    }
    onChange(value.filter((row) => row.id !== rowId));
  }

  return (
    <Box component="section" sx={productFormSectionGridSx}>
      <Box component="header" sx={productFormSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{
          fontWeight: 600
        }}>
          Fornecedores
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Relacione os fornecedores responsáveis por este produto.
        </Typography>
      </Box>
      <Box
        sx={{
          ...productFormSectionBoxSx,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {value.map((row) => (
          <SupplierRowFields
            key={row.id}
            row={row}
            options={supplierOptions}
            loading={suppliersQuery.isLoading}
            onChange={(patch) => onChange(updateRow(value, row.id, patch))}
            onRemove={() => handleRemoveRow(row.id)}
            canRemove={
              value.length > 1 ||
              Boolean(row.supplierId || row.code || row.conversion)
            }
          />
        ))}

        <Button
          type="button"
          variant="text"
          onClick={handleAddRow}
          startIcon={<Add sx={{ fontSize: 16 }} />}
          sx={{ alignSelf: "flex-start", px: 0 }}
        >
          Adicionar fornecedor
        </Button>
      </Box>
    </Box>
  );
}

function SupplierRowFields({
  row,
  options,
  loading,
  onChange,
  onRemove,
  canRemove,
}: {
  row: ProductSupplierRow;
  options: SupplierOption[];
  loading: boolean;
  onChange: (patch: Partial<ProductSupplierRow>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const optionsWithSelected = useMemo(() => {
    if (!row.supplierId) return options;
    if (options.some((option) => option.id === row.supplierId)) return options;
    return [
      {
        id: row.supplierId,
        name: row.supplierName || row.supplierId,
        document: "",
      },
      ...options,
    ];
  }, [options, row.supplierId, row.supplierName]);

  const selected =
    optionsWithSelected.find((option) => option.id === row.supplierId) ?? null;

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        gap: 1.5,
      }}
    >
      <Box sx={{ minWidth: "14rem", flex: 2 }}>
        <Autocomplete
          id={`supplier-search-${row.id}`}
          options={optionsWithSelected}
          value={selected}
          loading={loading}
          onChange={(_event, next) => {
            onChange({
              supplierId: next?.id ?? "",
              supplierName: next?.name ?? "",
            });
          }}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          filterOptions={(opts, state) => {
            const query = state.inputValue.trim().toLowerCase();
            if (!query) return opts;
            return opts.filter((option) => {
              const haystack =
                `${option.name} ${option.document}`.toLowerCase();
              return haystack.includes(query);
            });
          }}
          label="Fornecedor"
          placeholder="Buscar fornecedor…"
          noOptionsText="Nenhum fornecedor encontrado"
          loadingText="Carregando…"
          renderOption={(props, option) => {
            const { key, ...optionProps } = props;
            return (
              <Box component="li" key={key} {...optionProps}>
                <Stack spacing={0.25} sx={{ py: 0.25 }}>
                  <Typography variant="body2">{option.name}</Typography>
                  {option.document ? (
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>
                      {option.document}
                    </Typography>
                  ) : null}
                </Stack>
              </Box>
            );
          }}
        />
      </Box>
      <Box sx={{ minWidth: "8rem", flex: 1 }}>
        <FormField
          id={`supplier-code-${row.id}`}
          label="Código"
          placeholder="Cód. fornecedor"
          value={row.code}
          onChange={(event) => onChange({ code: event.target.value })}
        />
      </Box>
      <Box sx={{ minWidth: "8rem", flex: 1 }}>
        <FormField
          id={`supplier-conversion-${row.id}`}
          label="Conversão"
          inputMode="decimal"
          placeholder="Ex.: 12"
          value={row.conversion}
          onChange={(event) => onChange({ conversion: event.target.value })}
          slotProps={{
            input: {
              endAdornment: (
                <Tooltip title={CONVERSION_TOOLTIP} arrow placement="top">
                  <Box
                    component="button"
                    type="button"
                    aria-label="O que é conversão?"
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 20,
                      height: 20,
                      p: 0,
                      mr: 0.5,
                      border: 0,
                      bgcolor: "transparent",
                      color: "text.secondary",
                      cursor: "help",
                    }}
                  >
                    <InfoOutlined sx={{ fontSize: 14 }} />
                  </Box>
                </Tooltip>
              ),
            },
          }}
        />
      </Box>
      <Button
        type="button"
        variant="text"
        disabled={!canRemove}
        aria-label="Remover fornecedor"
        onClick={onRemove}
        sx={{ flexShrink: 0, minWidth: 0, mb: 0.25 }}
      >
        <DeleteOutlined sx={{ fontSize: 16 }} />
      </Button>
    </Box>
  );
}
