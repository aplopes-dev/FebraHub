'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@citybox/ui/atoms';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { erpDataTableNoActionsStyleProps } from '@/features/shared/lib/data-table-styles';
import { useSignaturePackageRequestsQuery } from '../hooks/use-signature-packages-queries';
import type { SignaturePackageRequest } from '../services/signature-packages.api.service';
import {
  formatSignaturePackageRequestDate,
  formatSignaturePackageRequestPackageLabel,
  SIGNATURE_PACKAGE_REQUEST_STATUS_BADGE_CLASS,
  SIGNATURE_PACKAGE_REQUEST_STATUS_LABEL,
} from '../lib/signature-package-request-labels';

const PER_PAGE = 10;

type AssinaturaSolicitacoesHistoricoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type HistoricoRow = {
  id: string;
  dateLabel: string;
  packageLabel: string;
  status: SignaturePackageRequest['status'];
};

/** Modal com histórico paginado (DataTable) de solicitações de pacote. */
export function AssinaturaSolicitacoesHistoricoDialog({
  open,
  onOpenChange,
}: AssinaturaSolicitacoesHistoricoDialogProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (open) setPage(1);
  }, [open]);

  const { data, isLoading, isFetching } = useSignaturePackageRequestsQuery(
    { page, perPage: PER_PAGE },
    open,
  );

  const rows = useMemo<HistoricoRow[]>(
    () =>
      (data?.items ?? []).map((request) => ({
        id: request.id,
        dateLabel: formatSignaturePackageRequestDate(request.createdAt),
        packageLabel: formatSignaturePackageRequestPackageLabel(
          request.quantity,
        ),
        status: request.status,
      })),
    [data?.items],
  );

  const columns = useMemo<ColumnDef<HistoricoRow>[]>(
    () => [
      {
        accessorKey: 'dateLabel',
        header: 'Data',
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.dateLabel}</span>
        ),
      },
      {
        accessorKey: 'packageLabel',
        header: 'Assinatura',
        cell: ({ row }) => row.original.packageLabel,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              SIGNATURE_PACKAGE_REQUEST_STATUS_BADGE_CLASS[row.original.status]
            }
          >
            {SIGNATURE_PACKAGE_REQUEST_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
    ],
    [],
  );

  const pageCount = data?.meta.totalPages ?? 0;
  const totalRowCount = data?.meta.total ?? 0;
  const loading = isLoading || isFetching;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-2xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b px-6 py-3 text-left">
          <DialogTitle className="text-lg">Histórico de solicitações</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-4">
          {loading && rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando solicitações…
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={rows}
              pageSize={PER_PAGE}
              entityName="solicitações"
              emptyMessage="Nenhuma solicitação ainda."
              emptyPaginationLabel="Nenhuma solicitação"
              manualPagination
              pageIndex={page - 1}
              pageCount={Math.max(pageCount, 1)}
              totalRowCount={totalRowCount}
              onPageIndexChange={(nextIndex) => setPage(nextIndex + 1)}
              {...erpDataTableNoActionsStyleProps}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
