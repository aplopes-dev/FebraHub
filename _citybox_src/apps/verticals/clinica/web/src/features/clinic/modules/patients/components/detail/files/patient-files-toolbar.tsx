'use client';

import { Camera, FileUp, FolderOpen, FolderPlus, ImagePlus, Plus } from 'lucide-react';
import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label,
} from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';
import { useCan } from '@/features/clinic/permissions';

export type PatientFilesNewAction = 'create-folder' | 'upload-image' | 'upload-file' | 'take-photo';

type PatientFilesToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onNewAction: (action: PatientFilesNewAction) => void;
  showSelectAll?: boolean;
  selectAllState?: boolean | 'indeterminate';
  onSelectAllChange?: (checked: boolean | 'indeterminate') => void;
};

export function PatientFilesToolbar({
  search,
  onSearchChange,
  onNewAction,
  showSelectAll = false,
  selectAllState = false,
  onSelectAllChange,
}: PatientFilesToolbarProps) {
  const canCreate = useCan('create', 'PatientFile');

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-12">
        <div className="flex items-center gap-2.5">
          <FolderOpen className="size-6 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Arquivos</h2>
        </div>

        {showSelectAll ? (
          <div className="flex items-center gap-2 pl-0.5">
            <Checkbox
              id="patient-files-select-all"
              checked={selectAllState}
              onCheckedChange={onSelectAllChange}
              aria-label="Selecionar todas as pastas e arquivos"
            />
            <Label htmlFor="patient-files-select-all" className="text-sm font-normal text-foreground">
              Selecionar todas
            </Label>
          </div>
        ) : null}
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar em todos os arquivos"
            className="h-10 w-full border-border bg-card"
            aria-label="Buscar arquivos e pastas"
          />
        </div>

        {canCreate ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="lg" className="shrink-0">
                <Plus className="mr-2 size-4" aria-hidden />
                Novo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => onNewAction('create-folder')}>
                <FolderPlus className="mr-2 size-4" aria-hidden />
                Pasta
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNewAction('upload-image')}>
                <ImagePlus className="mr-2 size-4" aria-hidden />
                Imagem
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNewAction('upload-file')}>
                <FileUp className="mr-2 size-4" aria-hidden />
                Arquivo
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onNewAction('take-photo')}>
                <Camera className="mr-2 size-4" aria-hidden />
                Tirar foto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
