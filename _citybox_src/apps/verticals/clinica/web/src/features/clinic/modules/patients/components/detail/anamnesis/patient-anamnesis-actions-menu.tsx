'use client';

import {
  Eye,
  FileSignature,
  Link2,
  MoreHorizontal,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import type { PatientAnamnesis } from '../../../types/patient-anamnesis';

export type PatientAnamnesisAction =
  | 'view'
  | 'emit-signature'
  | 'share-signature-link'
  | 'cancel-signature'
  | 'delete';

type PatientAnamnesisActionsMenuProps = {
  anamnesis: PatientAnamnesis;
  disabled?: boolean;
  onAction: (action: PatientAnamnesisAction) => void;
};

export function PatientAnamnesisActionsMenu({
  anamnesis,
  disabled = false,
  onAction,
}: PatientAnamnesisActionsMenuProps) {
  const isSigned = anamnesis.signatureStatus === 'signed';
  const isPending = anamnesis.signatureStatus === 'pending';
  const canRequestSignature =
    anamnesis.status === 'issued' && anamnesis.signatureStatus === 'unsigned';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Ações da anamnese ${anamnesis.templateName}`}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onAction('view')}>
          <Eye className="mr-2 size-4" aria-hidden />
          Ver anamnese
        </DropdownMenuItem>

        {isPending ? (
          <>
            <DropdownMenuItem onSelect={() => onAction('cancel-signature')}>
              <XCircle className="mr-2 size-4" aria-hidden />
              Cancelar assinatura
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction('share-signature-link')}>
              <Link2 className="mr-2 size-4" aria-hidden />
              Compartilhar link assinatura
            </DropdownMenuItem>
          </>
        ) : null}

        {isSigned ? null : (
          <>
            {canRequestSignature ? (
              <DropdownMenuItem onSelect={() => onAction('emit-signature')}>
                <FileSignature className="mr-2 size-4" aria-hidden />
                Emitir assinatura
              </DropdownMenuItem>
            ) : null}
            {!isPending ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => onAction('delete')}
                >
                  <Trash2 className="mr-2 size-4" aria-hidden />
                  Excluir anamnese
                </DropdownMenuItem>
              </>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
