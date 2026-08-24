'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { Icon } from '@citybox/mui/icons';
import { DataTable, type DataTableColumn } from '@citybox/mui/organisms';
import type { FinancialEntry } from '../types';
import { formatCurrency, paymentMethodLabel } from '../lib/filter-entries';
import { formatDisplayDate } from '../lib/period';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

type CashFlowTableProps = {
  entries: FinancialEntry[];
  isLoading?: boolean;
  onPay?: (entry: FinancialEntry) => void;
  onReceive?: (entry: FinancialEntry) => void;
  onEdit?: (entry: FinancialEntry) => void;
  onDelete?: (entry: FinancialEntry) => void;
  onViewPayment?: (entry: FinancialEntry) => void;
  onCancelPayment?: (entry: FinancialEntry) => void;
};

function StatusBadge({ entry }: { entry: FinancialEntry }) {
  if (entry.isOverdue) {
    return (
      <Chip size="small" label="Vencido" color="error" variant="outlined" />
    );
  }
  if (entry.status === 'received' || entry.status === 'paid') {
    return (
      <Chip
        size="small"
        label={entry.status === 'received' ? 'Recebido' : 'Pago'}
        color="success"
        variant="outlined"
      />
    );
  }
  if (entry.status === 'cancelled') {
    return <Chip size="small" label="Cancelado" variant="outlined" />;
  }
  return (
    <Chip size="small" label="Pendente" color="warning" variant="outlined" />
  );
}

export function CashFlowTable({
  entries,
  isLoading = false,
  onPay,
  onReceive,
  onEdit,
  onDelete,
  onViewPayment,
  onCancelPayment,
}: CashFlowTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const statusOrder = (e: FinancialEntry) => {
        if (e.status === 'pending') return e.isOverdue ? 0 : 1;
        if (e.status === 'paid' || e.status === 'received') return 2;
        return 3;
      };
      const statusDiff = statusOrder(a) - statusOrder(b);
      if (statusDiff !== 0) return statusDiff;
      if (a.dueDate < b.dueDate) return 1;
      if (a.dueDate > b.dueDate) return -1;
      return 0;
    });
  }, [entries]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * perPage;
    return sortedEntries.slice(start, start + perPage);
  }, [sortedEntries, page, perPage]);

  const columns: DataTableColumn<FinancialEntry>[] = [
    {
      id: 'dueDate',
      header: 'Vencimento',
      width: 120,
      render: (entry) => formatDisplayDate(entry.dueDate),
    },
    {
      id: 'description',
      header: 'Descrição',
      render: (entry) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          {entry.type === 'income' ? (
            <TrendingUpIcon fontSize="small" color="success" />
          ) : (
            <TrendingDownIcon fontSize="small" color="error" />
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {entry.description}
            </Typography>
            {entry.client ? (
              <Typography variant="caption" color="text.secondary" noWrap>
                {entry.client.name}
              </Typography>
            ) : null}
          </Box>
        </Stack>
      ),
    },
    {
      id: 'category',
      header: 'Categoria',
      render: (entry) => {
        const category =
          entry.type === 'income' ? entry.incomeCategory : entry.category;
        if (!category) return '—';
        return (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: category.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="body2" noWrap>
              {category.name}
            </Typography>
          </Stack>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      width: 120,
      render: (entry) => <StatusBadge entry={entry} />,
    },
    {
      id: 'account',
      header: 'Caixa',
      render: (entry) => entry.account?.name ?? '—',
    },
    {
      id: 'paymentMethod',
      header: 'Meio',
      render: (entry) => paymentMethodLabel(entry.paymentMethod),
    },
    {
      id: 'value',
      header: 'Valor',
      align: 'right',
      width: 120,
      render: (entry) => (
        <Typography
          variant="body2"
          sx={{
            color: entry.type === 'income' ? 'success.dark' : 'error.dark',
          }}
        >
          {formatCurrency(entry.value)}
        </Typography>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      align: 'right',
      width: 160,
      render: (entry) => (
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          {entry.type === 'income' &&
          entry.status === 'pending' &&
          onReceive ? (
            <Tooltip title="Receber">
              <IconButton
                size="small"
                aria-label="Receber"
                onClick={() => onReceive(entry)}
              >
                <Icon name="wallet" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
          {entry.type === 'expense' &&
          entry.status === 'pending' &&
          onPay ? (
            <Tooltip title="Pagar">
              <IconButton
                size="small"
                aria-label="Pagar"
                onClick={() => onPay(entry)}
              >
                <Icon name="wallet" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
          {(entry.status === 'paid' || entry.status === 'received') &&
          onViewPayment ? (
            <Tooltip title="Ver pagamento">
              <IconButton
                size="small"
                aria-label="Ver pagamento"
                onClick={() => onViewPayment(entry)}
              >
                <Icon name="eye" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
          {(entry.status === 'paid' || entry.status === 'received') &&
          onCancelPayment ? (
            <Tooltip title="Cancelar pagamento">
              <IconButton
                size="small"
                aria-label="Cancelar pagamento"
                onClick={() => onCancelPayment(entry)}
              >
                <Icon name="close" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
          {onEdit &&
          entry.status === 'pending' &&
          entry.origin === 'manual' ? (
            <Tooltip title="Editar">
              <IconButton
                size="small"
                aria-label="Editar"
                onClick={() => onEdit(entry)}
              >
                <Icon name="edit" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
          {onDelete ? (
            <Tooltip title="Excluir">
              <IconButton
                size="small"
                aria-label="Excluir"
                color="error"
                onClick={() => onDelete(entry)}
              >
                <Icon name="delete" size={18} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      ),
    },
  ];

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
        rows={pageRows}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        emptyMessage="Nenhum lançamento neste período."
        sx={{ flex: 1 }}
        pagination={{
          page,
          perPage,
          total: sortedEntries.length,
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
