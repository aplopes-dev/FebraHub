'use client';

import { Eye, MoreHorizontal, Pencil, Receipt, Trash2 } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import type { PatientTreatment } from '../../../types/patient-treatment';
import { formatPatientTreatmentLabel } from '../../../lib/patient-treatment-ui';

export type PatientTreatmentAction = 'view' | 'view-debit' | 'edit' | 'delete';

type PatientTreatmentActionsMenuProps = {
  treatment: PatientTreatment;
  disabled?: boolean;
  /** Tratamento já atendido não pode ser excluído — só editado. */
  showDelete?: boolean;
  /**
   * `finalized`: só Ver + Excluir (lista "Mostrar finalizados").
   * `default`: Ver débito + Editar (+ Excluir).
   */
  variant?: 'default' | 'finalized';
  onAction: (action: PatientTreatmentAction) => void;
};

export function PatientTreatmentActionsMenu({
  treatment,
  disabled = false,
  showDelete = true,
  variant = 'default',
  onAction,
}: PatientTreatmentActionsMenuProps) {
  const label = formatPatientTreatmentLabel(treatment);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant === 'finalized' ? 'ghost' : 'secondary'}
          size="icon-sm"
          disabled={disabled}
          aria-label={`Ações do procedimento ${label}`}
          className={
            variant === 'finalized'
              ? 'border-0 bg-transparent text-muted-foreground shadow-none hover:bg-transparent hover:text-muted-foreground'
              : undefined
          }
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {variant === 'finalized' ? (
          <>
            <DropdownMenuItem onSelect={() => onAction('view')}>
              <Eye className="mr-2 size-4" aria-hidden />
              Ver
            </DropdownMenuItem>
            {showDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onAction('delete')}
                >
                  <Trash2 className="mr-2 size-4" aria-hidden />
                  Excluir
                </DropdownMenuItem>
              </>
            ) : null}
          </>
        ) : (
          <>
            <DropdownMenuItem onSelect={() => onAction('view-debit')}>
              <Receipt className="mr-2 size-4" aria-hidden />
              Ver débito
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction('edit')}>
              <Pencil className="mr-2 size-4" aria-hidden />
              Editar
            </DropdownMenuItem>
            {showDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onAction('delete')}
                >
                  <Trash2 className="mr-2 size-4" aria-hidden />
                  Excluir
                </DropdownMenuItem>
              </>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
