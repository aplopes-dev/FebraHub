'use client';

import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import type { PatientBudgetTreatmentItem } from '../../../types/patient-budget-form';

export type PatientBudgetTreatmentAction = 'edit' | 'duplicate' | 'delete';

type PatientBudgetTreatmentActionsMenuProps = {
  treatment: PatientBudgetTreatmentItem;
  onAction: (action: PatientBudgetTreatmentAction) => void;
};

export function PatientBudgetTreatmentActionsMenu({
  treatment,
  onAction,
}: PatientBudgetTreatmentActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label={`Ações do procedimento ${treatment.treatmentName}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onAction('edit')}>
          <Pencil className="mr-2 size-4" aria-hidden />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onAction('duplicate')}>
          <Copy className="mr-2 size-4" aria-hidden />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => onAction('delete')}
        >
          <Trash2 className="mr-2 size-4" aria-hidden />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
