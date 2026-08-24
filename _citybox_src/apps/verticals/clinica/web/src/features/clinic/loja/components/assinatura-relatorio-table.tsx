'use client';

import { useMemo, useState } from 'react';
import { Info, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import {
  ERP_DATA_TABLE_ACTIONS_CELL_CLASS,
  erpDataTableStyleProps,
} from '@/features/shared/lib/data-table-styles';
import { ErpDataTableActionsHeader } from '@/features/shared/components/erp-data-table-actions-header';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { PatientSignatureIssuedDialog } from '@/features/clinic/modules/patients/components/detail/signatures/patient-signature-issued-dialog';
import type { ElectronicSignature } from '@/features/clinic/modules/patients/types/electronic-signature';
import {
  ASSINATURA_RELATORIO_STATUS_LABEL,
  ASSINATURA_RELATORIO_TIPO_LABEL,
  type AssinaturaRelatorioRow,
} from '../data/assinatura-relatorio';

const DATA_COLUMN_HINT =
  'A data se refere ao dia em que o documento foi emitido e enviado por e-mail aos signatários.';

function formatIssuedAt(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function handleAction(label: string) {
  toast.info('Em breve');
  void label;
}

type AssinaturaRelatorioTableProps = {
  rows: AssinaturaRelatorioRow[];
  page: number;
  pageCount: number;
  totalRowCount: number;
  perPage: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
};

/** Tabela do relatório de assinaturas (server-side). */
export function AssinaturaRelatorioTable({
  rows,
  page,
  pageCount,
  totalRowCount,
  perPage,
  onPageChange,
  isLoading = false,
}: AssinaturaRelatorioTableProps) {
  const { clinicId } = useClinicId();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareSignature, setShareSignature] =
    useState<ElectronicSignature | null>(null);

  function handleShareLink(row: AssinaturaRelatorioRow) {
    setShareSignature(row.signature);
    setShareOpen(true);
  }

  const columns = useMemo<ColumnDef<AssinaturaRelatorioRow>[]>(
    () => [
      {
        id: 'issuedAt',
        accessorKey: 'issuedAt',
        header: () => (
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
            Data
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex text-muted-foreground hover:text-foreground"
                  aria-label={DATA_COLUMN_HINT}
                >
                  <Info className="size-3.5" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                {DATA_COLUMN_HINT}
              </TooltipContent>
            </Tooltip>
          </span>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-foreground">
            {formatIssuedAt(row.original.issuedAt)}
          </span>
        ),
      },
      {
        id: 'tipo',
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => (
          <span className="text-foreground">
            {ASSINATURA_RELATORIO_TIPO_LABEL[row.original.tipo]}
          </span>
        ),
      },
      {
        id: 'assinaturas',
        accessorKey: 'assinaturas',
        header: 'Assinaturas',
        cell: ({ row }) => (
          <span className="truncate text-foreground">
            <span className="tabular-nums">{row.original.assinaturas}</span>{' '}
            {row.original.pacienteNome}
          </span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isSigned = row.original.status === 'signed';
          return (
            <Badge
              variant="outline"
              className={
                isSigned
                  ? 'border-green-200 bg-green-50 text-green-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }
            >
              {ASSINATURA_RELATORIO_STATUS_LABEL[row.original.status]}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: () => <ErpDataTableActionsHeader />,
        enableSorting: false,
        cell: ({ row }) => {
          const isSigned = row.original.status === 'signed';
          return (
            <div className={ERP_DATA_TABLE_ACTIONS_CELL_CLASS}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Ações do documento"
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isSigned ? (
                    <DropdownMenuItem
                      onClick={() => handleAction('Ver documento')}
                    >
                      Ver documento
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => handleShareLink(row.original)}
                      >
                        Compartilhar link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleAction('Ver documento')}
                      >
                        Ver documento
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleAction('Cancelar assinatura')}
                      >
                        Cancelar assinatura
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [],
  );

  if (isLoading && rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando documentos…
      </p>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <DataTable
        columns={columns}
        data={rows}
        pageSize={perPage}
        entityName="documentos"
        emptyMessage="Nenhum documento no período."
        emptyPaginationLabel="Nenhum documento"
        manualPagination
        pageIndex={page - 1}
        pageCount={Math.max(pageCount, 1)}
        totalRowCount={totalRowCount}
        onPageIndexChange={(nextIndex) => onPageChange(nextIndex + 1)}
        {...erpDataTableStyleProps}
      />

      <PatientSignatureIssuedDialog
        open={shareOpen}
        onOpenChange={(open) => {
          setShareOpen(open);
          if (!open) setShareSignature(null);
        }}
        storeId={clinicId || 'mock-store'}
        signature={shareSignature}
      />
    </TooltipProvider>
  );
}
