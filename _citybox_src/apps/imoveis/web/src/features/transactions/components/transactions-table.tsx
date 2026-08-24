'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { Box, IconButton, Typography } from '@citybox/mui/atoms';
import { Panel } from '@/components/ui/panel';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { getAgentShortName } from '@/features/shared/constants/agents';
import { formatCents } from '@/features/shared/utils/format';
import {
  TRANSACTION_TYPE_LABEL,
  type Transaction,
} from '../types';
import { paymentMethodLabel } from '../lib/payment-method-labels';
import { TransactionStatusBadge } from './transaction-status-badge';

export function TransactionsTable({ transactions }: { transactions: readonly Transaction[] }) {
  const router = useRouter();

  if (transactions.length === 0) {
    return (
      <Panel className="px-6 py-12 text-center text-sm text-muted-foreground">
        Nenhuma transação encontrada.
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden p-0">
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <Box component="thead">
          <Box component="tr" sx={{ borderBottom: 1, borderColor: 'divider' }}>
            {['Negócio', 'Tipo', 'Pagamento', 'Valor', 'Corretores', 'Status', ''].map((header, i) => (
              <Box
                key={header || 'action'}
                component="th"
                sx={{
                  px: 2,
                  py: 1.5,
                  textAlign: i === 6 ? 'right' : 'left',
                  fontWeight: 500,
                  color: 'text.secondary',
                  display:
                    i === 1
                      ? { xs: 'none', md: 'table-cell' }
                      : i === 2
                        ? { xs: 'none', lg: 'table-cell' }
                      : i === 3
                        ? { xs: 'none', xl: 'table-cell' }
                        : i === 4
                          ? { xs: 'none', sm: 'table-cell' }
                          : 'table-cell',
                  width: i === 6 ? 48 : undefined,
                }}
              >
                {header}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {transactions.map((tx) => (
            <Box
              component="tr"
              key={tx.id}
              onClick={() => router.push(`/transactions/${tx.id}`)}
              sx={{
                cursor: 'pointer',
                borderBottom: 1,
                borderColor: 'divider',
                '&:last-child': { borderBottom: 0 },
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box component="td" sx={{ px: 2, py: 1.5 }}>
                <Typography sx={{ fontWeight: 500 }}>{tx.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {tx.propertyName}
                </Typography>
              </Box>
              <Box
                component="td"
                sx={{
                  px: 2,
                  py: 1.5,
                  color: 'text.secondary',
                  display: { xs: 'none', md: 'table-cell' },
                }}
              >
                {TRANSACTION_TYPE_LABEL[tx.type]}
              </Box>
              <Box
                component="td"
                sx={{
                  px: 2,
                  py: 1.5,
                  color: 'text.secondary',
                  display: { xs: 'none', lg: 'table-cell' },
                }}
              >
                {paymentMethodLabel(tx.paymentMethod)}
              </Box>
              <Box
                component="td"
                sx={{
                  px: 2,
                  py: 1.5,
                  fontWeight: 500,
                  display: { xs: 'none', xl: 'table-cell' },
                }}
              >
                {formatCents(tx.grossValueCents)}
              </Box>
              <Box
                component="td"
                sx={{
                  px: 2,
                  py: 1.5,
                  color: 'text.secondary',
                  display: { xs: 'none', sm: 'table-cell' },
                }}
              >
                {getAgentShortName(tx.captorId)}
                {tx.sellerId ? ` / ${getAgentShortName(tx.sellerId)}` : ''}
              </Box>
              <Box component="td" sx={{ px: 2, py: 1.5 }}>
                <TransactionStatusBadge status={tx.status} />
              </Box>
              <Box component="td" sx={{ px: 2, py: 1.5, textAlign: 'right' }}>
                <Link href={`/transactions/${tx.id}`} onClick={(event) => event.stopPropagation()}>
                  <IconButton
                    aria-label={`Ver ${tx.title}`}
                    size="small"
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      bgcolor: (theme) => listifyElevatedSurface(theme),
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                      },
                    }}
                  >
                    <NorthEastIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Link>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Panel>
  );
}
