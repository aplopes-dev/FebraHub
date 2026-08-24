'use client';

import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { usePatientBudgetPermissions } from '../../../hooks/use-patient-budget-permissions';

import { Check, FileText } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Badge,
  Button,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import {
  PATIENT_BUDGET_STATUS_BADGE_CLASS,
  PATIENT_BUDGET_STATUS_LABEL,
} from '../../../lib/patient-budget-ui';
import {
  getNextPatientBudgetSort,
  type PatientBudgetSort,
  type PatientBudgetSortColumn,
} from '../../../lib/sort-patient-budgets';
import type { PatientBudget } from '../../../types/patient-budget';
import type { PatientBudgetListMeta } from '../../../types/patient-budget-api';
import {
  PatientBudgetActionsMenu,
  type PatientBudgetAction,
} from './patient-budget-actions-menu';
import { PatientBudgetTreatmentsDialog } from './patient-budget-treatments-dialog';
import { PatientBudgetTreatmentsInfoButton } from './patient-budget-treatments-info-button';
import { PatientBudgetSortableHeader } from './patient-budget-sortable-header';
import {
  PATIENT_DATA_TABLE_CLASS,
  PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS,
  PATIENT_TABLE_CARD_CLASS,
} from '../../../lib/patient-detail-tabs-ui';
import {
  PatientBudgetsPaginationBar,
  type PatientBudgetPageSize,
} from './patient-budgets-pagination-bar';

type PatientBudgetsTableProps = {
  budgets: PatientBudget[];
  meta: PatientBudgetListMeta;
  page: number;
  pageSize: PatientBudgetPageSize;
  sort: PatientBudgetSort | null;
  emptyMessage: string;
  header?: ReactNode;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PatientBudgetPageSize) => void;
  onSortChange: (sort: PatientBudgetSort) => void;
  onBudgetAction: (budget: PatientBudget, action: PatientBudgetAction) => void;
  onContractAction?: (budget: PatientBudget) => void;
  onResolveBudgetDetail?: (budgetId: string) => Promise<PatientBudget>;
  isResolvingBudgetDetail?: boolean;
};

const SIGNATURE_PENDING_COLOR = 'text-[#C4A000]';
const SIGNATURE_PENDING_HOVER = 'hover:text-[#B08F00]';

function formatBudgetDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
}

function formatSignedDay(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function SignedCheckIcon() {
  return (
    <span
      className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-green-600"
      aria-hidden
    >
      <Check className="size-2.5 stroke-[3] text-white" />
    </span>
  );
}

function contractSignerStatusLine(input: {
  status: 'unsigned' | 'pending' | 'signed' | null | undefined;
  signedAt: string | null | undefined;
}): { label: string; className: string } {
  if (input.status === 'signed') {
    const day = input.signedAt ? formatSignedDay(input.signedAt) : '';
    return {
      label: day ? `Assinou em ${day}` : 'Assinado',
      className: 'text-green-700',
    };
  }
  if (input.status === 'pending') {
    return {
      label: 'Assinatura pendente',
      className: SIGNATURE_PENDING_COLOR,
    };
  }
  return {
    label: 'Sem assinatura',
    className: 'text-muted-foreground',
  };
}

function BudgetContractIconButton({
  budget,
  onClick,
}: {
  budget: PatientBudget;
  onClick?: (budget: PatientBudget) => void;
}) {
  const approved = budget.status === 'approved';
  const hasContract = Boolean(budget.contractEmissionId);
  const signedCount = [
    budget.contractPatientSignatureStatus,
    budget.contractResponsibleSignatureStatus,
  ].filter((status) => status === 'signed').length;
  // Cinza só sem contrato; amarelo assim que o contrato existe (incl. assinatura
  // solicitada e ainda pendente); verde só com 2/2.
  const iconToneClass = !approved
    ? 'text-muted-foreground'
    : !hasContract
      ? 'text-muted-foreground'
      : signedCount >= 2
        ? 'text-green-600'
        : SIGNATURE_PENDING_COLOR;
  const simpleTooltip = !approved
    ? 'Contrato somente para orçamento aprovado'
    : !hasContract
      ? 'Emitir contrato'
      : null;
  const patientSig = budget.contractPatientSignatureStatus;
  const responsibleSig = budget.contractResponsibleSignatureStatus;
  const withoutElectronicSignature =
    (!patientSig || patientSig === 'unsigned') &&
    (!responsibleSig || responsibleSig === 'unsigned');
  const countClass =
    signedCount >= 2
      ? 'text-green-700'
      : SIGNATURE_PENDING_COLOR;
  const patientStatus = contractSignerStatusLine({
    status: patientSig,
    signedAt: budget.contractPatientSignedAt,
  });
  const clinicStatus = contractSignerStatusLine({
    status: responsibleSig,
    signedAt: budget.contractResponsibleSignedAt,
  });

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn(
        'size-8 hover:bg-transparent',
        signedCount >= 2 && approved && hasContract
          ? 'hover:text-green-700'
          : approved && hasContract
            ? SIGNATURE_PENDING_HOVER
            : 'hover:text-muted-foreground',
        iconToneClass,
      )}
      disabled={!approved || !onClick}
      aria-label={
        simpleTooltip ??
        (withoutElectronicSignature
          ? 'Contrato sem assinatura eletrônica'
          : signedCount >= 2
            ? 'Contrato assinado (2/2)'
            : signedCount === 1
              ? 'Assinatura pendente (1/2)'
              : 'Assinatura pendente (0/2)')
      }
      onClick={() => {
        if (approved) onClick?.(budget);
      }}
    >
      <FileText className={cn('size-5', iconToneClass)} aria-hidden />
    </Button>
  );

  if (!approved || !hasContract) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">{simpleTooltip}</TooltipContent>
      </Tooltip>
    );
  }

  if (withoutElectronicSignature) {
    return (
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          <span className="inline-flex">{button}</span>
        </HoverCardTrigger>
        <HoverCardContent side="bottom" align="end" className="w-auto max-w-xs px-3 py-2">
          <p className="text-sm text-foreground">
            Contrato sem assinatura eletrônica
          </p>
        </HoverCardContent>
      </HoverCard>
    );
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="inline-flex">{button}</span>
      </HoverCardTrigger>
      <HoverCardContent side="bottom" align="end" className="w-96 max-w-[min(24rem,calc(100vw-2rem))] gap-0 p-0">
        <div className="px-3 py-2.5">
          <p className={cn('text-base font-bold', countClass)}>
            {signedCount}/2 assinaturas
          </p>
        </div>
        <Separator />
        <div className="px-3 py-2.5">
          <p className="text-xs text-muted-foreground">Paciente/responsável</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm whitespace-nowrap text-foreground">
            {patientSig === 'signed' ? <SignedCheckIcon /> : null}
            <span>
              <span className="font-medium">
                {budget.contractPatientName?.trim() || '—'}
              </span>{' '}
              <span className={patientStatus.className}>{patientStatus.label}</span>
            </span>
          </p>
        </div>
        <Separator />
        <div className="px-3 py-2.5">
          <p className="text-xs text-muted-foreground">Clínica</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm whitespace-nowrap text-foreground">
            {responsibleSig === 'signed' ? <SignedCheckIcon /> : null}
            <span>
              <span className="font-medium">
                {budget.contractResponsibleName?.trim() || '—'}
              </span>{' '}
              <span className={clinicStatus.className}>{clinicStatus.label}</span>
            </span>
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function PatientBudgetsTable({
  budgets,
  meta,
  page,
  pageSize,
  sort,
  emptyMessage,
  header,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onBudgetAction,
  onContractAction,
  onResolveBudgetDetail,
  isResolvingBudgetDetail = false,
}: PatientBudgetsTableProps) {
  const { canUpdate } = usePatientBudgetPermissions();
  const [treatmentsDialogBudget, setTreatmentsDialogBudget] = useState<PatientBudget | null>(null);
  const [isLoadingTreatmentsDialog, setIsLoadingTreatmentsDialog] = useState(false);

  const totalPages = Math.max(1, meta.totalPages || 1);

  const handleOpenTreatmentsDialog = useCallback(
    async (budget: PatientBudget) => {
      if (budget.treatments.length > 0) {
        setTreatmentsDialogBudget(budget);
        return;
      }

      if (!onResolveBudgetDetail) {
        setTreatmentsDialogBudget(budget);
        return;
      }

      setIsLoadingTreatmentsDialog(true);
      try {
        const detail = await onResolveBudgetDetail(budget.id);
        setTreatmentsDialogBudget(detail);
      } finally {
        setIsLoadingTreatmentsDialog(false);
      }
    },
    [onResolveBudgetDetail],
  );

  const handleSort = useCallback(
    (column: PatientBudgetSortColumn) => {
      onSortChange(getNextPatientBudgetSort(sort, column));
    },
    [onSortChange, sort],
  );

  const columns = useMemo<ColumnDef<PatientBudget>[]>(
    () => [
      {
        id: 'date',
        accessorKey: 'date',
        header: () => (
          <PatientBudgetSortableHeader
            label="Data"
            column="date"
            sort={sort}
            onSort={handleSort}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-foreground">{formatBudgetDate(row.original.date)}</span>
        ),
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: () => (
          <PatientBudgetSortableHeader
            label="Descrição"
            column="description"
            sort={sort}
            onSort={handleSort}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">{row.original.description}</span>
            {row.original.treatments.length > 0 || (row.original.itemsCount ?? 0) > 0 ? (
              <PatientBudgetTreatmentsInfoButton
                disabled={isResolvingBudgetDetail || isLoadingTreatmentsDialog}
                onClick={() => void handleOpenTreatmentsDialog(row.original)}
              />
            ) : null}
          </div>
        ),
      },
      {
        id: 'finalValue',
        accessorKey: 'finalValueCents',
        header: () => (
          <PatientBudgetSortableHeader
            label="Valor Final"
            column="finalValue"
            sort={sort}
            onSort={handleSort}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground">
            {formatBrlCurrencyFromCents(row.original.finalValueCents)}
          </span>
        ),
      },
      {
        id: 'status',
        accessorFn: (row) => PATIENT_BUDGET_STATUS_LABEL[row.status],
        header: () => (
          <PatientBudgetSortableHeader
            label="Status"
            column="status"
            sort={sort}
            onSort={handleSort}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn('font-normal', PATIENT_BUDGET_STATUS_BADGE_CLASS[row.original.status])}
          >
            {PATIENT_BUDGET_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'edit',
        header: () => <span className="sr-only">Editar</span>,
        enableSorting: false,
        cell: ({ row }) =>
          canUpdate &&
          (row.original.status === 'draft' || row.original.status === 'rejected') ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs font-semibold tracking-wide"
              onClick={() => onBudgetAction(row.original, 'edit')}
            >
              EDITAR
            </Button>
          ) : null,
      },
      {
        id: 'actions',
        header: () => (
          <span className="block w-full text-right font-medium text-foreground">Ações</span>
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5">
            <BudgetContractIconButton
              budget={row.original}
              onClick={onContractAction}
            />
            <PatientBudgetActionsMenu
              budget={row.original}
              onAction={(action) => onBudgetAction(row.original, action)}
            />
          </div>
        ),
      },
    ],
    [canUpdate, handleOpenTreatmentsDialog, handleSort, isLoadingTreatmentsDialog, isResolvingBudgetDetail, onBudgetAction, onContractAction, sort],
  );

  return (
    <TooltipProvider delayDuration={200}>
    <div className={PATIENT_TABLE_CARD_CLASS}>
      {header ? <div className="mb-4">{header}</div> : null}
      <DataTable
        columns={columns}
        data={budgets}
        pageSize={pageSize}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        totalRowCount={meta.total}
        entityName="orçamento"
        emptyMessage={emptyMessage}
        emptyPaginationLabel="Nenhum orçamento"
        enableSorting={false}
        paginationClassName="hidden"
        tableClassName={PATIENT_DATA_TABLE_CLASS}
        headerClassName={PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS}
      />

      <PatientBudgetsPaginationBar
        page={page}
        pageSize={pageSize}
        total={meta.total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <PatientBudgetTreatmentsDialog
        budget={treatmentsDialogBudget}
        onOpenChange={(open) => {
          if (!open) {
            setTreatmentsDialogBudget(null);
          }
        }}
      />
    </div>
    </TooltipProvider>
  );
}
