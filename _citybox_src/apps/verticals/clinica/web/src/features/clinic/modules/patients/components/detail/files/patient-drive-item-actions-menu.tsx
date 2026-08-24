'use client';

import { Download, FolderInput, FolderOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import { useCan } from '@/features/clinic/permissions';
import type { PatientDriveItemAction } from '../../../types/patient-file';

type PatientDriveItemActionsMenuProps = {
  itemName: string;
  showDownload?: boolean;
  onAction: (action: PatientDriveItemAction) => void;
};

export function PatientDriveItemActionsMenu({
  itemName,
  showDownload = false,
  onAction,
}: PatientDriveItemActionsMenuProps) {
  const canUpdate = useCan('update', 'PatientFile');
  const canDelete = useCan('delete', 'PatientFile');
  const hasMutations = canUpdate || canDelete;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1 right-1 z-10 size-7 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label={`Ações de ${itemName}`}
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onSelect={() => onAction('open')}>
          <FolderOpen className="mr-2 size-4" aria-hidden />
          Abrir
        </DropdownMenuItem>
        {showDownload ? (
          <DropdownMenuItem onSelect={() => onAction('download')}>
            <Download className="mr-2 size-4" aria-hidden />
            Baixar
          </DropdownMenuItem>
        ) : null}
        {canUpdate ? (
          <DropdownMenuItem onSelect={() => onAction('rename')}>
            <Pencil className="mr-2 size-4" aria-hidden />
            Renomear
          </DropdownMenuItem>
        ) : null}
        {canUpdate ? (
          <DropdownMenuItem onSelect={() => onAction('move')}>
            <FolderInput className="mr-2 size-4" aria-hidden />
            Mover
          </DropdownMenuItem>
        ) : null}
        {hasMutations && canDelete ? <DropdownMenuSeparator /> : null}
        {canDelete ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onAction('delete')}
          >
            <Trash2 className="mr-2 size-4" aria-hidden />
            Excluir
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
