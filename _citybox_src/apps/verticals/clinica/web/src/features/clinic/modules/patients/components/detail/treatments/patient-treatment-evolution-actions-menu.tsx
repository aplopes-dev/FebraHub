'use client';

import { Download, History, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import { useCan } from '@/features/clinic/permissions';
import type { PatientTreatmentEvolution } from '../../../types/patient-treatment';

export type PatientTreatmentEvolutionAction =
  | 'download-document'
  | 'action-history'
  | 'edit'
  | 'delete';

type PatientTreatmentEvolutionActionsMenuProps = {
  evolution: PatientTreatmentEvolution;
  onAction: (action: PatientTreatmentEvolutionAction) => void;
};

export function PatientTreatmentEvolutionActionsMenu({
  evolution,
  onAction,
}: PatientTreatmentEvolutionActionsMenuProps) {
  const canUpdate = useCan('update', 'PatientEvolution');
  const canDelete = useCan('delete', 'PatientEvolution');
  const isSigned = evolution.signatureStatus === 'signed';
  const showWriteActions = !isSigned && (canUpdate || canDelete);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`Ações da evolução de ${evolution.description}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isSigned ? (
          <DropdownMenuItem onSelect={() => onAction('download-document')}>
            <Download className="mr-2 size-4" aria-hidden />
            Baixar documento
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onSelect={() => onAction('action-history')}>
          <History className="mr-2 size-4" aria-hidden />
          Histórico de ações
        </DropdownMenuItem>
        {showWriteActions ? (
          <>
            {canUpdate ? (
              <DropdownMenuItem onSelect={() => onAction('edit')}>
                <Pencil className="mr-2 size-4" aria-hidden />
                Editar evolução
              </DropdownMenuItem>
            ) : null}
            {canDelete ? (
              <>
                {canUpdate ? <DropdownMenuSeparator /> : null}
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
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
