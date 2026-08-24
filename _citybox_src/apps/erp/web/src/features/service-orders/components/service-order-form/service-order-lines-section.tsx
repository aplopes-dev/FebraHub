"use client";

import { useMemo } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Autocomplete,
  Button,
  CurrencyInput,
  Input,
  MenuItem,
  NumberInput,
  Select,
} from "@citybox/mui";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ServiceOrderSection } from "@/features/service-orders/components/service-order-form/service-order-section";
import { createEmptyLine } from "@/features/service-orders/lib/service-order-form-values";
import {
  computeLineTotal,
  computeServiceOrderTotal,
  formatCurrencyBRL,
  sumLinesByKind,
} from "@/features/service-orders/lib/service-order-totals";
import { useCatalogProductsQuery } from "@/features/products/hooks/use-product-queries";
import { SERVICE_ORDER_LINE_STATUS_LABELS } from "@/features/service-orders/types/service-order";
import type {
  ServiceOrderLine,
  ServiceOrderLineStatus,
} from "@/features/service-orders/types/service-order";

const LINE_STATUS_ORDER: ServiceOrderLineStatus[] = [
  "pending",
  "in_progress",
  "done",
];

type ServiceOrderLinesSectionProps = {
  lines: ServiceOrderLine[];
  onUpdate: (id: string, patch: Partial<ServiceOrderLine>) => void;
  onAdd: (line: ServiceOrderLine) => void;
  onRemove: (id: string) => void;
};

type ProductOption = {
  id: string;
  label: string;
  sku: string;
};

export function ServiceOrderLinesSection({
  lines,
  onUpdate,
  onAdd,
  onRemove,
}: ServiceOrderLinesSectionProps) {
  const productsQuery = useCatalogProductsQuery();
  const products = useMemo(
    () => productsQuery.data ?? [],
    [productsQuery.data],
  );

  const productOptions = useMemo<ProductOption[]>(
    () =>
      products.map((product) => ({
        id: product.id,
        label: product.name,
        sku: product.sku,
      })),
    [products],
  );

  const servicesSubtotal = sumLinesByKind(lines, "service");
  const productsSubtotal = sumLinesByKind(lines, "product");
  const total = computeServiceOrderTotal(lines);

  function handleProductPick(lineId: string, productId: string) {
    const product = products.find((entry) => entry.id === productId);
    onUpdate(lineId, {
      productId,
      description: product?.name ?? "",
      unitPrice: product?.basePrice ?? 0,
    });
  }

  const columns = useMemo<DataTableColumn<ServiceOrderLine>[]>(
    () => [
      {
        id: "item",
        header: "Item",
        width: 260,
        render: (line) =>
          line.kind === "product" ? (
            <Autocomplete
              options={productOptions}
              value={
                productOptions.find((option) => option.id === line.productId) ??
                null
              }
              onChange={(_, option) =>
                handleProductPick(line.id, option?.id ?? "")
              }
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">{option.label}</Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {option.sku}
                    </Typography>
                  </Box>
                </li>
              )}
              placeholder="Selecionar produto/peça"
              noOptionsText="Nenhum produto encontrado."
            />
          ) : (
            <Input
              value={line.description}
              onChange={(event) =>
                onUpdate(line.id, { description: event.target.value })
              }
              placeholder="Ex.: Mão de obra técnica (hora)"
              aria-label="Descrição do serviço"
              fullWidth
            />
          ),
      },
      {
        id: "quantity",
        header: "Qtde",
        width: 140,
        render: (line) => (
          <NumberInput
            minValue={0}
            value={line.quantity}
            onValueChange={(quantity) => onUpdate(line.id, { quantity })}
            aria-label="Quantidade"
          />
        ),
      },
      {
        id: "unitPrice",
        header: "Valor unit.",
        width: 160,
        render: (line) => (
          <CurrencyInput
            value={line.unitPrice}
            onValueChange={(unitPrice) => onUpdate(line.id, { unitPrice })}
            slotProps={{ htmlInput: { "aria-label": "Valor unitário" } }}
          />
        ),
      },
      {
        id: "discount",
        header: "Desconto",
        width: 160,
        render: (line) => (
          <CurrencyInput
            value={line.discount}
            onValueChange={(discount) => onUpdate(line.id, { discount })}
            slotProps={{ htmlInput: { "aria-label": "Desconto" } }}
          />
        ),
      },
      {
        id: "status",
        header: "Status",
        width: 180,
        render: (line) => (
          <FormControl fullWidth>
            <InputLabel id={`line-status-label-${line.id}`}>Status</InputLabel>
            <Select
              labelId={`line-status-label-${line.id}`}
              label="Status"
              value={line.status}
              onChange={(event) =>
                onUpdate(line.id, {
                  status: event.target.value as ServiceOrderLineStatus,
                })
              }
            >
              {LINE_STATUS_ORDER.map((status) => (
                <MenuItem key={status} value={status}>
                  {SERVICE_ORDER_LINE_STATUS_LABELS[status]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ),
      },
      {
        id: "total",
        header: "Total",
        align: "right",
        width: 120,
        render: (line) => (
          <Typography
            variant="body2"
            sx={{ fontVariantNumeric: "tabular-nums" }}
          >
            {formatCurrencyBRL(computeLineTotal(line))}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "",
        align: "right",
        width: 56,
        render: (line) => (
          <IconButton
            type="button"
            size="small"
            aria-label="Remover item"
            onClick={() => onRemove(line.id)}
          >
            <DeleteOutlinedIcon fontSize="small" />
          </IconButton>
        ),
      },
    ],
    [productOptions, onUpdate, onRemove],
  );

  return (
    <ServiceOrderSection
      title="Serviços e produtos"
      description="O que será cobrado do cliente: mão de obra, serviços prestados e peças utilizadas. O total é calculado automaticamente (quantidade × valor − desconto)."
    >
      <Stack spacing={2.5}>
        <DataTable
          columns={columns}
          rows={lines}
          getRowId={(line) => line.id}
          emptyMessage="Nenhum item lançado. Adicione um serviço ou um produto."
        />

        <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => onAdd(createEmptyLine("service"))}
          >
            Adicionar serviço
          </Button>
          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon fontSize="small" />}
            onClick={() => onAdd(createEmptyLine("product"))}
          >
            Adicionar produto/peça
          </Button>
        </Stack>

        <Stack
          spacing={0.75}
          sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}
        >
          <Stack direction="row" spacing={3} sx={{ justifyContent: "flex-end" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Subtotal serviços
            </Typography>
            <Typography
              variant="body2"
              sx={{ minWidth: 96, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrencyBRL(servicesSubtotal)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ justifyContent: "flex-end" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Subtotal produtos
            </Typography>
            <Typography
              variant="body2"
              sx={{ minWidth: 96, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrencyBRL(productsSubtotal)}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={3}
            sx={{ justifyContent: "flex-end", pt: 0.5 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Total da OS
            </Typography>
            <Typography
              variant="body2"
              sx={{
                minWidth: 96,
                textAlign: "right",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrencyBRL(total)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </ServiceOrderSection>
  );
}
