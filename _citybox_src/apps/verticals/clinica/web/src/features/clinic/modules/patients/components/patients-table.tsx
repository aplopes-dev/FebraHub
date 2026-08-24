'use client';



import { useCallback, useMemo } from 'react';

import { cn } from '@citybox/ui';

import { Avatar, AvatarFallback, AvatarImage, Badge } from '@citybox/ui/atoms';

import { DataTable, type ColumnDef } from '@citybox/ui/organisms';

import { calculateAge } from '../lib/calculate-age';

import { formatPatientCpf, formatPatientPhone } from '../lib/format-patient-contact';

import type { PatientsTableSortColumn, PatientsTableSortDirection } from '../lib/patient-api-mappers';

import {

  CLINIC_PATIENT_STATUS_BADGE_CLASS,

  CLINIC_PATIENT_STATUS_LABEL,

} from '../lib/patient-ui';

import { getPatientInitials } from '../lib/patient-utils';

import type { ClinicPatient } from '../types/clinic-patient';

import type { PatientListMeta } from '../types/patient-api';

import {
  PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS,
  PATIENT_DATA_TABLE_WITH_ACTIONS_CLASS,
  PATIENT_TABLE_CARD_CLASS,
} from '../lib/patient-detail-tabs-ui';
import { PatientActionsMenu } from './patient-actions-menu';

import {
  PatientsPaginationBar,
  type PatientsPageSize,
} from './patients-pagination-bar';

import { PatientsSortableHeader } from './patients-sortable-header';



export type PatientsTableSortState = {

  columnId: PatientsTableSortColumn;

  direction: PatientsTableSortDirection;

} | null;



type PatientsTableProps = {

  patients: ClinicPatient[];

  meta: PatientListMeta;

  page: number;

  onPageChange: (page: number) => void;

  perPage: PatientsPageSize;

  onPerPageChange: (perPage: PatientsPageSize) => void;

  sort: PatientsTableSortState;

  onSortChange: (columnId: PatientsTableSortColumn) => void;

  emptyMessage: string;

  onPatientClick: (patient: ClinicPatient) => void;

  onEdit: (patient: ClinicPatient) => void;

  onToggleStatus: (patient: ClinicPatient) => void;

  canEdit?: boolean;

  canToggleStatus?: boolean;

  /** Quando false, o nome não navega para a ficha. */
  canOpenFicha?: boolean;

};



export function PatientsTable({

  patients,

  meta,

  page,

  onPageChange,

  perPage,

  onPerPageChange,

  sort,

  onSortChange,

  emptyMessage,

  onPatientClick,

  onEdit,

  onToggleStatus,

  canEdit = true,

  canToggleStatus = true,

  canOpenFicha = true,

}: PatientsTableProps) {

  const sortableColumn = useCallback(

    (columnId: PatientsTableSortColumn) => ({

      getIsSorted: () => {

        if (sort?.columnId !== columnId) return false as const;

        return sort.direction;

      },

      toggleSorting: () => {

        onSortChange(columnId);

      },

    }),

    [onSortChange, sort],

  );



  const columns = useMemo<ColumnDef<ClinicPatient>[]>(

    () => [

      {

        id: 'name',

        accessorKey: 'name',

        header: () => (

          <PatientsSortableHeader label="Nome" column={sortableColumn('name')} />

        ),

        cell: ({ row }) => {

          const patient = row.original;

          const identity = (
            <>
              <Avatar className="size-12 shrink-0 border border-border/40">

                {patient.photoUrl ? (

                  <AvatarImage src={patient.photoUrl} alt={patient.name} />

                ) : null}

                <AvatarFallback className="bg-muted/60 text-sm font-medium text-muted-foreground">

                  {getPatientInitials(patient.name)}

                </AvatarFallback>

              </Avatar>

              <div className="min-w-0">
                <p className={cn('truncate text-base font-medium', canOpenFicha ? 'text-primary' : 'text-foreground')}>
                  <span className={canOpenFicha ? 'underline-offset-4 group-hover:underline' : undefined}>{patient.name}</span>
                </p>
                {patient.cpf.trim() ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {formatPatientCpf(patient.cpf)}
                  </p>
                ) : null}
              </div>
            </>
          );

          if (!canOpenFicha) {
            return (
              <div className="flex w-full min-w-0 items-center gap-3">
                {identity}
              </div>
            );
          }

          return (

            <button

              type="button"

              onClick={() => onPatientClick(patient)}

              className="group flex w-full min-w-0 items-center gap-3 rounded-md text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

              aria-label={`Abrir ficha de ${patient.name}`}

            >

              {identity}

            </button>

          );

        },

      },

      {

        id: 'plan',

        accessorKey: 'planName',

        header: () => (

          <PatientsSortableHeader label="Plano" column={sortableColumn('plan')} />

        ),

        cell: ({ row }) => (

          <span className="text-sm text-foreground">{row.original.planName || '—'}</span>

        ),

      },

      {

        id: 'age',

        accessorFn: (row) => calculateAge(row.birthDate),

        header: () => (

          <PatientsSortableHeader label="Idade" column={sortableColumn('age')} />

        ),

        cell: ({ row }) => (

          <span className="text-sm text-foreground">

            {calculateAge(row.original.birthDate)} anos

          </span>

        ),

      },

      {

        id: 'contact',

        accessorKey: 'phone',

        header: () => (

          <span className="block w-full text-left font-medium text-foreground">Contato</span>

        ),

        enableSorting: false,

        cell: ({ row }) => (

          <span className="text-sm text-foreground">

            {formatPatientPhone(row.original.phone)}

          </span>

        ),

      },

      {

        id: 'category',

        accessorKey: 'categoryName',

        header: () => (

          <PatientsSortableHeader label="Categoria" column={sortableColumn('category')} />

        ),

        cell: ({ row }) => {

          const categoryName = row.original.categoryName;

          if (!categoryName) {

            return <span className="text-sm text-muted-foreground">—</span>;

          }



          return (

            <Badge variant="outline" className="text-xs font-normal">

              {categoryName}

            </Badge>

          );

        },

      },

      {

        id: 'status',

        accessorKey: 'status',

        header: () => (

          <PatientsSortableHeader label="Status" column={sortableColumn('status')} />

        ),

        cell: ({ row }) => (

          <Badge

            variant="outline"

            className={cn('text-xs', CLINIC_PATIENT_STATUS_BADGE_CLASS[row.original.status])}

          >

            {CLINIC_PATIENT_STATUS_LABEL[row.original.status]}

          </Badge>

        ),

      },

      {

        id: 'actions',

        header: () => (

          <span className="block w-full text-right font-medium text-foreground">Ações</span>

        ),

        enableSorting: false,

        cell: ({ row }) => (

          <div className="flex justify-end">

            <PatientActionsMenu

              patientName={row.original.name}

              status={row.original.status}

              onEdit={() => onEdit(row.original)}

              onToggleStatus={() => onToggleStatus(row.original)}

              canEdit={canEdit}

              canToggleStatus={canToggleStatus}

            />

          </div>

        ),

      },

    ],

    [canEdit, canToggleStatus, canOpenFicha, onToggleStatus, onEdit, onPatientClick, sortableColumn],

  );

  const paginationMeta = useMemo(() => {
    const resolvedPerPage = meta.perPage || perPage;
    const totalPages =
      meta.totalPages > 0
        ? meta.totalPages
        : meta.total > 0
          ? Math.ceil(meta.total / resolvedPerPage)
          : 0;

    return { ...meta, perPage: resolvedPerPage, totalPages };
  }, [meta, perPage]);

  return (

    <div className={PATIENT_TABLE_CARD_CLASS}>

      <DataTable

        columns={columns}

        data={patients}

        pageSize={paginationMeta.perPage}

        emptyMessage={emptyMessage}

        enableSorting={false}

        manualPagination

        pageIndex={page - 1}

        pageCount={Math.max(paginationMeta.totalPages, 1)}

        totalRowCount={paginationMeta.total}

        paginationClassName="hidden"

        tableClassName={PATIENT_DATA_TABLE_WITH_ACTIONS_CLASS}

        headerClassName={PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS}

      />

      <PatientsPaginationBar
        page={page}
        pageSize={perPage}
        total={paginationMeta.total}
        totalPages={paginationMeta.totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPerPageChange}
      />

    </div>

  );

}


