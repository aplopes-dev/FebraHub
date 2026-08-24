'use client';

import Link from 'next/link';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { IconButton } from '@citybox/mui/atoms';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { Panel } from '@/components/ui/panel';
import { useClientListPagination } from '@/features/shared/hooks/use-client-list-pagination';
import { formatCents } from '@/features/shared/utils/format';
import { RENTAL_PAYOUT_STATUS_LABEL } from '@/features/transactions/types';
import type { PersonalCommissionEntry, RentalPayoutRow } from '../types';

export function PersonalCommissionsTable({
  entries,
}: {
  entries: readonly PersonalCommissionEntry[];
}) {
  const pagination = useClientListPagination(entries);

  if (entries.length === 0) {
    return (
      <Panel
        className="px-4 py-6 text-sm text-muted-foreground sm:px-6 sm:py-8"
        sx={{ borderRadius: { xs: '14px', sm: '20px' } }}
      >
        Nenhuma comissão encontrada.
      </Panel>
    );
  }

  return (
    <>
      <Panel
        className="overflow-hidden p-0"
        sx={{ borderRadius: { xs: '14px', sm: '20px' }, minWidth: 0 }}
      >
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-muted-foreground">
                <th className="px-3 py-3 sm:px-4">Negócio</th>
                <th className="px-3 py-3 sm:px-4">Papel</th>
                <th className="px-3 py-3 sm:px-4">Status</th>
                <th className="px-3 py-3 text-right sm:px-4">Valor</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((entry) => (
                <tr
                  key={`${entry.transactionId}-${entry.role}`}
                  className="border-b border-border/40"
                >
                  <td className="px-3 py-3 sm:px-4">
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">{entry.propertyName}</p>
                  </td>
                  <td className="px-3 py-3 text-muted-foreground sm:px-4">
                    {entry.role === 'captor' ? 'Captador' : 'Vendedor'}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    {entry.status === 'released' ? 'Liberada' : 'Pendente'}
                  </td>
                  <td className="px-3 py-3 text-right font-medium tabular-nums sm:px-4">
                    {formatCents(entry.amountCents)}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <Link href={`/transactions/${entry.transactionId}`}>
                      <IconButton
                        size="small"
                        aria-label={`Ver ${entry.title}`}
                        sx={{ bgcolor: 'action.selected' }}
                      >
                        <NorthEastIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <ListifyPagination
        count={pagination.total}
        page={pagination.page}
        perPage={pagination.perPage}
        onPageChange={pagination.setPage}
        onPerPageChange={pagination.setPerPage}
        rowsPerPageOptions={pagination.perPageOptions}
      />
    </>
  );
}

export function RentalPayoutsTable({ rows }: { rows: readonly RentalPayoutRow[] }) {
  const pagination = useClientListPagination(rows);

  if (rows.length === 0) {
    return (
      <Panel
        className="px-4 py-6 text-sm text-muted-foreground sm:px-6 sm:py-8"
        sx={{ borderRadius: { xs: '14px', sm: '20px' } }}
      >
        Nenhum repasse de locação.
      </Panel>
    );
  }

  return (
    <>
      <Panel
        className="overflow-hidden p-0"
        sx={{ borderRadius: { xs: '14px', sm: '20px' }, minWidth: 0 }}
      >
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead>
              <tr className="border-b border-border/70 text-left text-muted-foreground">
                <th className="px-3 py-3 sm:px-4">Imóvel</th>
                <th className="px-3 py-3 sm:px-4">Inquilino</th>
                <th className="px-3 py-3 sm:px-4">Aluguel</th>
                <th className="px-3 py-3 sm:px-4">Taxa adm.</th>
                <th className="px-3 py-3 sm:px-4">Repasse</th>
                <th className="px-3 py-3 sm:px-4">Status</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {pagination.pageItems.map((row) => (
                <tr key={row.transactionId} className="border-b border-border/40">
                  <td className="px-3 py-3 font-medium sm:px-4">{row.propertyName}</td>
                  <td className="px-3 py-3 text-muted-foreground sm:px-4">
                    {row.tenantName}
                  </td>
                  <td className="px-3 py-3 tabular-nums sm:px-4">
                    {formatCents(row.rentCents)}
                  </td>
                  <td className="px-3 py-3 tabular-nums sm:px-4">
                    {formatCents(row.adminFeeCents)}
                  </td>
                  <td className="px-3 py-3 font-medium tabular-nums sm:px-4">
                    {formatCents(row.payoutCents)}
                  </td>
                  <td className="px-3 py-3 text-xs sm:px-4">
                    {RENTAL_PAYOUT_STATUS_LABEL[row.status]}
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <Link href={`/transactions/${row.transactionId}`}>
                      <IconButton
                        size="small"
                        aria-label={`Ver ${row.propertyName}`}
                        sx={{ bgcolor: 'action.selected' }}
                      >
                        <NorthEastIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <ListifyPagination
        count={pagination.total}
        page={pagination.page}
        perPage={pagination.perPage}
        onPageChange={pagination.setPage}
        onPerPageChange={pagination.setPerPage}
        rowsPerPageOptions={pagination.perPageOptions}
      />
    </>
  );
}
