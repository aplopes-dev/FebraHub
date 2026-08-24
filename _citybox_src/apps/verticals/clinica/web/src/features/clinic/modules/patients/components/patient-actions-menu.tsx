'use client';

import { MoreHorizontal, Pencil, UserCheck, UserX } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import {
  getPatientStatusToggleMode,
  PATIENT_STATUS_TOGGLE_COPY,
} from '../lib/patient-status-toggle';
import type { ClinicPatientStatus } from '../types/clinic-patient';

type PatientActionsMenuProps = {
  patientName: string;
  status: ClinicPatientStatus;
  onEdit: () => void;
  onToggleStatus: () => void;
  canEdit?: boolean;
  canToggleStatus?: boolean;
};

export function PatientActionsMenu({
  patientName,
  status,
  onEdit,
  onToggleStatus,
  canEdit = true,
  canToggleStatus = true,
}: PatientActionsMenuProps) {
  if (!canEdit && !canToggleStatus) return null;

  const toggleMode = getPatientStatusToggleMode(status);
  const toggleCopy = PATIENT_STATUS_TOGGLE_COPY[toggleMode];
  const ToggleIcon = toggleMode === 'activate' ? UserCheck : UserX;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label={`Ações de ${patientName}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit ? (
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className="mr-2 size-4" aria-hidden />
            Editar
          </DropdownMenuItem>
        ) : null}
        {canEdit && canToggleStatus ? <DropdownMenuSeparator /> : null}
        {canToggleStatus ? (
          <DropdownMenuItem
            className={
              toggleMode === 'deactivate'
                ? 'text-destructive focus:text-destructive'
                : undefined
            }
            onSelect={onToggleStatus}
          >
            <ToggleIcon className="mr-2 size-4" aria-hidden />
            {toggleCopy.menuLabel}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
