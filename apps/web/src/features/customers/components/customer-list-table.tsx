"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import { Checkbox, Typography } from "@/ui";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import {
  formatCustomerCreatedAt,
  formatCustomerSales,
} from "@/features/customers/services/customer-list.service";
import type { Customer } from "@/features/customers/types/customer";

type CustomerListTableProps = {
  customers: Customer[];
  /** Página 1-based (mock / Zustand). */
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  selectedIds: Set<string>;
  allPageSelected: boolean;
  somePageSelected: boolean;
  onToggleSelectAllPage: () => void;
  onToggleSelectOne: (id: string) => void;
};

export function CustomerListTable({
  customers,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  selectedIds,
  allPageSelected,
  somePageSelected,
  onToggleSelectAllPage,
  onToggleSelectOne,
}: CustomerListTableProps) {
  const columns = useMemo<DataTableColumn<Customer>[]>(
    () => [
      {
        id: "select",
        width: 48,
        header: (
          <Checkbox
            slotProps={{ input: { "aria-label": "Selecionar todos desta página" } }}
            checked={allPageSelected}
            indeterminate={somePageSelected && !allPageSelected}
            onChange={() => onToggleSelectAllPage()}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        render: (customer) => (
          <Box
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <Checkbox
              slotProps={{
                input: { "aria-label": `Selecionar ${customer.name}` },
              }}
              checked={selectedIds.has(customer.id)}
              onChange={() => onToggleSelectOne(customer.id)}
            />
          </Box>
        ),
      },
      {
        id: "name",
        header: "Nome",
        render: (customer) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {customer.name}
          </Typography>
        ),
      },
      {
        id: "email",
        header: "E-mail",
        render: (customer) => customer.email,
      },
      {
        id: "phone",
        header: "Telefone",
        render: (customer) => customer.phone,
      },
      {
        id: "sales",
        header: "Vendas",
        render: (customer) => formatCustomerSales(customer.salesTotal),
      },
      {
        id: "createdAt",
        header: "Data da criação",
        render: (customer) => formatCustomerCreatedAt(customer.createdAt),
      },
    ],
    [
      allPageSelected,
      somePageSelected,
      selectedIds,
      onToggleSelectAllPage,
      onToggleSelectOne,
    ],
  );

  return (
    <DataTable
      columns={columns}
      rows={customers}
      getRowId={(customer) => customer.id}
      emptyMessage="Nenhum cliente encontrado."
      pagination={{
        page,
        perPage: pageSize,
        total,
        onPageChange,
        onPerPageChange: onPageSizeChange,
      }}
    />
  );
}
