'use client';

import { FileSpreadsheet, FileText, Folder, ImageIcon } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Checkbox } from '@citybox/ui/atoms';
import type { PatientDriveItemAction, PatientFile, PatientFolder } from '../../../types/patient-file';
import {
  toPatientFileKey,
  toPatientFolderKey,
  type PatientDriveItemKey,
} from '../../../lib/patient-drive-selection';
import { formatFileSize } from '../../../lib/format-file-size';
import { PatientDriveItemActionsMenu } from './patient-drive-item-actions-menu';

type PatientFilesGridProps = {
  className?: string;
  folders: PatientFolder[];
  files: PatientFile[];
  selectedKeys: readonly PatientDriveItemKey[];
  onToggleSelection: (itemKey: PatientDriveItemKey) => void;
  onOpenFolder: (folderId: string) => void;
  onOpenFile: (file: PatientFile) => void;
  onFolderAction: (folder: PatientFolder, action: PatientDriveItemAction) => void;
  onFileAction: (file: PatientFile, action: PatientDriveItemAction) => void;
  emptyMessage?: string;
};

const GRID_AREA_EMPTY_CLASS = 'flex h-[297.33px] w-full flex-col items-center justify-center';

const GRID_AREA_WITH_ITEMS_CLASS = 'flex h-[414px] w-full flex-col';

const GRID_CLASS =
  'grid h-full w-full content-start gap-4 overflow-y-auto [grid-template-columns:repeat(auto-fill,354.44px)] [grid-auto-rows:397.95px]';

const ITEM_INTERACTIVE_CLASS =
  'group transition-colors hover:border-primary hover:bg-muted/40';

const ITEM_SELECTED_CLASS = 'border-primary bg-primary/5 ring-2 ring-primary/20';

const ITEM_CLASS =
  'relative flex h-[397.95px] w-[354.44px] shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-border bg-card p-3';

function getDriveItemCardClass(isSelected: boolean) {
  return cn(ITEM_CLASS, ITEM_INTERACTIVE_CLASS, isSelected && ITEM_SELECTED_CLASS);
}

function resolveFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  return FileText;
}

export function PatientFilesGrid({
  className,
  folders,
  files,
  selectedKeys,
  onToggleSelection,
  onOpenFolder,
  onOpenFile,
  onFolderAction,
  onFileAction,
  emptyMessage = 'Esta pasta está vazia',
}: PatientFilesGridProps) {
  const selectedKeySet = new Set(selectedKeys);
  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return (
      <div className={cn(GRID_AREA_EMPTY_CLASS, className)}>
        <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn(GRID_AREA_WITH_ITEMS_CLASS, className)}>
      <div className={GRID_CLASS}>
        {folders.map((folder) => {
          const itemKey = toPatientFolderKey(folder.id);
          const isSelected = selectedKeySet.has(itemKey);
          const checkboxId = `patient-drive-folder-${folder.id}`;

          return (
          <div key={folder.id} className={getDriveItemCardClass(isSelected)}>
            <Checkbox
              id={checkboxId}
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(itemKey)}
              className="absolute top-2 left-2 z-10 bg-background"
              aria-label={`Selecionar pasta ${folder.name}`}
              onClick={(event) => event.stopPropagation()}
            />
            <PatientDriveItemActionsMenu
              itemName={folder.name}
              onAction={(action) => onFolderAction(folder, action)}
            />
            <button
              type="button"
              onClick={() => onOpenFolder(folder.id)}
              className="flex size-full flex-col items-center justify-center gap-2 pt-4"
            >
              <Folder
                className="size-10 shrink-0 text-muted-foreground transition-transform group-hover:scale-105 sm:size-12"
                aria-hidden
              />
              <span className="line-clamp-2 w-full text-center text-xs font-medium text-foreground sm:text-sm">
                {folder.name}
              </span>
            </button>
          </div>
          );
        })}

        {files.map((file) => {
          const FileIcon = resolveFileIcon(file.mimeType);
          const isImage = file.kind === 'image' && file.previewUrl;
          const itemKey = toPatientFileKey(file.id);
          const isSelected = selectedKeySet.has(itemKey);
          const checkboxId = `patient-drive-file-${file.id}`;

          return (
            <div key={file.id} className={getDriveItemCardClass(isSelected)}>
              <Checkbox
                id={checkboxId}
                checked={isSelected}
                onCheckedChange={() => onToggleSelection(itemKey)}
                className="absolute top-2 left-2 z-10 bg-background"
                aria-label={`Selecionar arquivo ${file.name}`}
                onClick={(event) => event.stopPropagation()}
              />
              <PatientDriveItemActionsMenu
                itemName={file.name}
                showDownload
                onAction={(action) => onFileAction(file, action)}
              />
              <button
                type="button"
                onClick={() => onOpenFile(file)}
                className="flex size-full flex-col items-center justify-center gap-2 pt-4"
              >
                {isImage ? (
                  <span
                    role="img"
                    aria-label={`Pré-visualização de ${file.name}`}
                    className="h-56 w-full max-w-[288px] shrink-0 rounded-lg bg-cover bg-center transition-transform group-hover:scale-[1.02]"
                    style={{ backgroundImage: `url(${file.previewUrl})` }}
                  />
                ) : (
                  <FileIcon
                    className="size-10 shrink-0 text-muted-foreground transition-transform group-hover:scale-105 sm:size-12"
                    aria-hidden
                  />
                )}
                <span className="line-clamp-2 w-full text-center text-xs font-medium text-foreground sm:text-sm">
                  {file.name}
                </span>
                <span className="text-[10px] text-muted-foreground sm:text-xs">
                  {formatFileSize(file.sizeBytes)}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
