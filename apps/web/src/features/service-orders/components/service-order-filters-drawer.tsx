"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Checkbox,
  DateRangePicker,
  Drawer,
  MenuItem,
  Select,
  type DateRange,
} from "@/ui";
import { createEmptyServiceOrderFilters } from "@/features/service-orders/lib/service-order-filters";
import { listAllServiceOrderStatuses } from "@/features/service-orders/services/service-order-status.service";
import { useSaleOrderSellersQuery } from "@/features/sales-orders/hooks/use-sale-order-sellers-query";
import type { ServiceOrderListFilters } from "@/features/service-orders/types/service-order";

type ServiceOrderFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ServiceOrderListFilters;
  onApply: (filters: ServiceOrderListFilters) => void;
};

function toggleInList(list: string[], item: string): string[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function filtersToDateRange(
  filters: ServiceOrderListFilters,
): DateRange | undefined {
  if (!filters.openedFrom && !filters.openedTo) return undefined;
  return {
    from: filters.openedFrom
      ? new Date(`${filters.openedFrom}T00:00:00`)
      : undefined,
    to: filters.openedTo ? new Date(`${filters.openedTo}T00:00:00`) : undefined,
  };
}

export function ServiceOrderFiltersDrawer({
  open,
  onOpenChange,
  value,
  onApply,
}: ServiceOrderFiltersDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Filtrar ordens de serviço"
      width={400}
    >
      <ServiceOrderFiltersDrawerBody
        key={open ? "open" : "closed"}
        value={value}
        onApply={onApply}
        onClose={() => onOpenChange(false)}
      />
    </Drawer>
  );
}

function ServiceOrderFiltersDrawerBody({
  value,
  onApply,
  onClose,
}: {
  value: ServiceOrderListFilters;
  onApply: (filters: ServiceOrderListFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<ServiceOrderListFilters>({
    ...value,
    statusIds: [...value.statusIds],
  });
  const statuses = useMemo(() => listAllServiceOrderStatuses(), []);
  const sellersQuery = useSaleOrderSellersQuery();
  const sellers = useMemo(
    () => sellersQuery.data ?? [],
    [sellersQuery.data],
  );

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClear() {
    setDraft(createEmptyServiceOrderFilters());
  }

  return (
    <>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Refine a lista por status, técnico responsável e período de abertura.
      </Typography>

      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Status
          </Typography>
          <Stack spacing={0.5}>
            {statuses.map((status) => (
              <FormControlLabel
                key={status.id}
                control={
                  <Checkbox
                    checked={draft.statusIds.includes(status.id)}
                    onChange={() =>
                      setDraft((prev) => ({
                        ...prev,
                        statusIds: toggleInList(prev.statusIds, status.id),
                      }))
                    }
                  />
                }
                label={status.name}
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Técnico responsável
          </Typography>
          <FormControl fullWidth>
            <InputLabel id="filter-technician-label">Técnico</InputLabel>
            <Select
              labelId="filter-technician-label"
              id="filter-technician"
              label="Técnico"
              value={draft.technicianName ?? ""}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  technicianName: String(event.target.value) || null,
                }))
              }
            >
              <MenuItem value="">Todos</MenuItem>
              {sellers.map((seller) => (
                <MenuItem key={seller.id} value={seller.name}>
                  {seller.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Período de abertura
          </Typography>
          <DateRangePicker
            value={filtersToDateRange(draft)}
            onChange={(range) =>
              setDraft((prev) => ({
                ...prev,
                openedFrom: range?.from ? toIsoDate(range.from) : null,
                openedTo: range?.to ? toIsoDate(range.to) : null,
              }))
            }
          />
        </Box>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Button type="button" variant="outlined" fullWidth onClick={handleClear}>
          Limpar
        </Button>
        <Button
          type="button"
          variant="contained"
          fullWidth
          onClick={handleApply}
        >
          Aplicar
        </Button>
      </Stack>
    </>
  );
}
