'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { DataTable, type DataTableColumn } from '@citybox/mui/organisms';
import type { PaymentMethodSummary } from '../types';
import { formatCurrency, paymentMethodLabel } from '../lib/filter-entries';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

type TransactionsByMethodTableProps = {
  rows: PaymentMethodSummary[];
  isLoading?: boolean;
  onViewMethod?: (method: string) => void;
};

export function TransactionsByMethodTable({
  rows,
  isLoading = false,
  onViewMethod,
}: TransactionsByMethodTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return rows.slice(start, start + perPage);
  }, [rows, page, perPage]);

  const columns: DataTableColumn<PaymentMethodSummary>[] = useMemo(
    () => [
      {
        id: 'method',
        header: 'Meio de pagamento',
        render: (row) => paymentMethodLabel(row.method),
      },
      {
        id: 'income',
        header: 'Receitas',
        align: 'right',
        render: (row) => (
          <Typography variant="body2" sx={{ color: 'success.dark' }}>
            {formatCurrency(row.income)}
          </Typography>
        ),
      },
      {
        id: 'expense',
        header: 'Despesas',
        align: 'right',
        render: (row) => (
          <Typography variant="body2" sx={{ color: 'error.dark' }}>
            {formatCurrency(row.expense)}
          </Typography>
        ),
      },
      {
        id: 'balance',
        header: 'Saldo',
        align: 'right',
        render: (row) => (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: row.balance < 0 ? 'error.dark' : 'text.primary',
            }}
          >
            {formatCurrency(row.balance)}
          </Typography>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        align: 'right',
        width: 100,
        render: (row) =>
          onViewMethod ? (
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onViewMethod(row.method);
              }}
            >
              Ver
            </Button>
          ) : null,
      },
    ],
    [onViewMethod],
  );

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <DataTable
        columns={columns}
        rows={paginatedRows}
        getRowId={(row) => row.method}
        isLoading={isLoading}
        emptyMessage="Nenhuma transação liquidada neste período."
        pagination={{
          page,
          perPage,
          total: rows.length,
          onPageChange: setPage,
          onPerPageChange: (next) => {
            setPerPage(next);
            setPage(1);
          },
          perPageOptions: PAGE_SIZE_OPTIONS,
        }}
      />
    </Paper>
  );
}
