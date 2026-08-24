'use client';

import { Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import type { PatientFinancialEntry } from '../../../types/patient-financial-entry';

export type PatientFinancialAction = 'edit' | 'delete';

type PatientFinancialActionsMenuProps = {
  entry: PatientFinancialEntry;
  disabled?: boolean;
  onAction: (action: PatientFinancialAction) => void;
};

export function PatientFinancialActionsMenu({
  entry,
  disabled = false,
  onAction,
}: PatientFinancialActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Ações do lançamento ${entry.name}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onAction('edit')}>
          <Pencil className="mr-2 size-4" aria-hidden />
          Editar
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
