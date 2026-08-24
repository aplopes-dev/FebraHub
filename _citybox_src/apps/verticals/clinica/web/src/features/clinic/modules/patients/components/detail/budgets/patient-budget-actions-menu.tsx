'use client';

import {
  Copy,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Printer,
  Trash2,
} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import { usePatientBudgetPermissions } from '../../../hooks/use-patient-budget-permissions';
import type { PatientBudget } from '../../../types/patient-budget';

export type PatientBudgetAction =
  | 'edit'
  | 'send-whatsapp'
  | 'send-email'
  | 'duplicate'
  | 'print'
  | 'delete';

type PatientBudgetActionsMenuProps = {
  budget: PatientBudget;
  onAction: (action: PatientBudgetAction) => void;
};

export function PatientBudgetActionsMenu({ budget, onAction }: PatientBudgetActionsMenuProps) {
  const { canRead, canCreate, canDelete } = usePatientBudgetPermissions();
  const hasItems = canRead || canCreate || canDelete;

  if (!hasItems) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label={`Ações do orçamento ${budget.description}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canRead ? (
          <>
            <DropdownMenuItem onSelect={() => onAction('send-whatsapp')}>
              <MessageCircle className="mr-2 size-4" aria-hidden />
              Enviar por WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction('send-email')}>
              <Mail className="mr-2 size-4" aria-hidden />
              Enviar por e-mail
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction('print')}>
              <Printer className="mr-2 size-4" aria-hidden />
              Imprimir orçamento
            </DropdownMenuItem>
          </>
        ) : null}
        {canCreate ? (
          <DropdownMenuItem onSelect={() => onAction('duplicate')}>
            <Copy className="mr-2 size-4" aria-hidden />
            Duplicar orçamento
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <>
            {(canRead || canCreate) ? <DropdownMenuSeparator /> : null}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onAction('delete')}
            >
              <Trash2 className="mr-2 size-4" aria-hidden />
              Excluir orçamento
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
