'use client';

import { MoreHorizontal, Pencil } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import type { ClinicAnamnesisQuestion } from '../types/clinic-anamnesis';

type AnamnesisQuestionActionsMenuProps = {
  question: ClinicAnamnesisQuestion;
  canEdit: boolean;
  onEdit: (question: ClinicAnamnesisQuestion) => void;
};

export function AnamnesisQuestionActionsMenu({
  question,
  canEdit,
  onEdit,
}: AnamnesisQuestionActionsMenuProps) {
  if (!canEdit) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Ações da pergunta ${question.text}`}
          className="h-8 w-8 shrink-0"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="z-[70] w-44"
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              window.setTimeout(() => onEdit(question), 0);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
