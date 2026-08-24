"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  DatePicker,
  Drawer,
  MenuItem,
  NumberInput,
  ScrollArea,
  Select,
} from "@citybox/mui";
import { useTechnicalSheetsListQuery } from "@/features/technical-sheets/hooks/use-technical-sheet-queries";
import { createEmptyTechnicalSheetFilters } from "@/features/technical-sheets/lib/technical-sheet-filters";
import { useAllStocksQuery } from "@/features/stock/hooks/use-stock-queries";
import { ProductionProductAutocomplete } from "@/features/production/components/production-product-autocomplete";
import { useProductionOrderForm } from "@/features/production/hooks/use-production-order-form";
import { parseIsoDate, toIsoDate } from "@/lib/date";

type ProductionOrderCreateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function ProductionOrderCreateDrawer({
  open,
  onOpenChange,
  onCreated,
}: ProductionOrderCreateDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Novo pedido de produção"
      width={512}
    >
      {open ? (
        <ProductionOrderCreateDrawerContent
          onOpenChange={onOpenChange}
          onCreated={onCreated}
        />
      ) : null}
    </Drawer>
  );
}

function ProductionOrderCreateDrawerContent({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const { values, setField, submit, isSubmitting } = useProductionOrderForm({
    onCreated: () => {
      onOpenChange(false);
      onCreated();
    },
  });

  const productsQuery = useTechnicalSheetsListQuery({
    tab: "production",
    search: "",
    category: "",
    filters: createEmptyTechnicalSheetFilters(),
    sort: "name_asc",
    page: 1,
    perPage: 100,
  });
  const products = productsQuery.data?.data ?? [];

  const stocksQuery = useAllStocksQuery();
  const stocks = stocksQuery.data ?? [];

  const expectedDate = parseIsoDate(values.expectedDate);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ScrollArea sx={{ flex: 1, minHeight: 0 }}>
        <Stack spacing={2.5} sx={{ pb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Só produtos com processo produtivo aparecem na lista.
          </Typography>

          <ProductionProductAutocomplete
            products={products}
            value={values.productId}
            onChange={(productId) => setField("productId", productId)}
            loading={productsQuery.isLoading}
          />

          <NumberInput
            id="prod-quantity"
            label="Quantidade a produzir"
            value={values.plannedQuantity}
            minValue={1}
            step={1}
            onValueChange={(value) => setField("plannedQuantity", Math.max(0, value))}
            aria-label="Quantidade a produzir"
          />

          <FormControl fullWidth>
            <InputLabel id="prod-source-label">Estoque de origem</InputLabel>
            <Select
              labelId="prod-source-label"
              id="prod-source"
              label="Estoque de origem"
              value={values.sourceStockId || ""}
              onChange={(event) => setField("sourceStockId", String(event.target.value))}
            >
              {stocks.map((stock) => (
                <MenuItem key={stock.id} value={stock.id}>
                  {stock.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel id="prod-destination-label">Estoque de destino</InputLabel>
            <Select
              labelId="prod-destination-label"
              id="prod-destination"
              label="Estoque de destino"
              value={values.destinationStockId || ""}
              onChange={(event) =>
                setField("destinationStockId", String(event.target.value))
              }
            >
              {stocks.map((stock) => (
                <MenuItem key={stock.id} value={stock.id}>
                  {stock.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <DatePicker
            id="prod-date"
            label="Data de previsão"
            value={expectedDate}
            onChange={(date) => setField("expectedDate", date ? toIsoDate(date) : "")}
            aria-label="Data de previsão"
          />
        </Stack>
      </ScrollArea>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          justifyContent: "flex-end",
          pt: 2,
          mt: "auto",
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <Button type="button" variant="outlined" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          loading={isSubmitting}
          onClick={submit}
        >
          Gerar Pedido
        </Button>
      </Stack>
    </Box>
  );
}
