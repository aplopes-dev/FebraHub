'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@citybox/ui/organisms';
import { useStore } from '@/lib/store-context';
import { downloadPatientFile } from '../../../lib/download-patient-file';
import {
  getVisiblePatientDriveItemKeys,
  isAllPatientDriveItemsSelected,
  isSomePatientDriveItemsSelected,
  selectAllPatientDriveItemKeys,
  togglePatientDriveItemSelection,
  type PatientDriveItemKey,
} from '../../../lib/patient-drive-selection';
import { validatePatientFile } from '../../../lib/patient-file-mime';
import {
  getPatientFilesMutationErrorMessage,
  usePatientDriveBreadcrumbQuery,
  usePatientDriveQuery,
  usePatientFilesMutations,
  usePatientMoveDestinationsQuery,
} from '../../../hooks/use-patient-files-queries';
import { useDebouncedSearch } from '../../../hooks/use-debounced-search';
import type {
  PatientDriveItemAction,
  PatientDriveMoveDestination,
  PatientFile,
  PatientFileUploadTask,
  PatientFolder,
  PatientFolderBreadcrumb,
} from '../../../types/patient-file';
import { PatientCameraCaptureDialog } from '../files/patient-camera-capture-dialog';
import { PatientCreateFolderDialog } from '../files/patient-create-folder-dialog';
import { PatientFileImagePreviewDialog } from '../files/patient-file-image-preview-dialog';
import { PatientFileUploadQueue } from '../files/patient-file-upload-queue';
import { PatientFilesBreadcrumb } from '../files/patient-files-breadcrumb';
import { PatientFilesGrid } from '../files/patient-files-grid';
import { PatientMoveDriveItemDialog } from '../files/patient-move-drive-item-dialog';
import { PatientRenameDriveItemDialog } from '../files/patient-rename-drive-item-dialog';
import {
  PatientFilesToolbar,
  type PatientFilesNewAction,
} from '../files/patient-files-toolbar';

type SelectedDriveItem =
  | { type: 'folder'; item: PatientFolder }
  | { type: 'file'; item: PatientFile };

const IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/*';
const FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain';

const EMPTY_DRIVE_FOLDERS: PatientFolder[] = [];
const EMPTY_DRIVE_FILES: PatientFile[] = [];
const EMPTY_MOVE_DESTINATIONS: PatientDriveMoveDestination[] = [];
const ROOT_BREADCRUMB: PatientFolderBreadcrumb[] = [{ id: null, name: 'Arquivos' }];

type PatientFilesTabProps = {
  patientId: string;
};

export function PatientFilesTab({ patientId }: PatientFilesTabProps) {
  const { storeId } = useStore();
  const { search, debouncedSearch, handleSearchChange, clearSearch } = useDebouncedSearch();
  const {
    createFolderMutation,
    uploadFileMutation,
    renameFolderMutation,
    renameFileMutation,
    deleteFolderMutation,
    deleteFileMutation,
    moveFolderMutation,
    moveFileMutation,
  } = usePatientFilesMutations(patientId);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<PatientFileUploadTask[]>([]);
  const [renamingItem, setRenamingItem] = useState<SelectedDriveItem | null>(null);
  const [movingItem, setMovingItem] = useState<SelectedDriveItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<SelectedDriveItem | null>(null);
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<PatientDriveItemKey[]>([]);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const driveQuery = usePatientDriveQuery(patientId, currentFolderId, debouncedSearch);
  const breadcrumbQuery = usePatientDriveBreadcrumbQuery(patientId, currentFolderId);
  const moveSubtreeId = movingItem?.type === 'folder' ? movingItem.item.id : null;
  const moveDestinationsQuery = usePatientMoveDestinationsQuery(
    patientId,
    moveSubtreeId,
    movingItem !== null,
  );

  const filteredFolders = driveQuery.data?.folders ?? EMPTY_DRIVE_FOLDERS;
  const filteredFiles = driveQuery.data?.files ?? EMPTY_DRIVE_FILES;
  const breadcrumbItems = breadcrumbQuery.data ?? ROOT_BREADCRUMB;
  const moveDestinations = moveDestinationsQuery.data ?? EMPTY_MOVE_DESTINATIONS;

  const previewImages = useMemo(
    () =>
      filteredFiles.filter(
        (file): file is PatientFile & { previewUrl: string } =>
          file.kind === 'image' && Boolean(file.previewUrl),
      ),
    [filteredFiles],
  );

  const previewImage = useMemo(
    () => previewImages.find((file) => file.id === previewImageId) ?? null,
    [previewImageId, previewImages],
  );

  const emptyMessage = search.trim()
    ? 'Nenhum item encontrado para a busca informada.'
    : driveQuery.isLoading
      ? 'Carregando arquivos...'
      : 'Esta pasta está vazia';

  const visibleItemKeys = useMemo(
    () => getVisiblePatientDriveItemKeys(filteredFolders, filteredFiles),
    [filteredFolders, filteredFiles],
  );

  const hasVisibleItems = visibleItemKeys.length > 0;
  const allSelected = isAllPatientDriveItemsSelected(visibleItemKeys, selectedKeys);
  const someSelected = isSomePatientDriveItemsSelected(visibleItemKeys, selectedKeys);
  const selectAllState = allSelected ? true : someSelected ? 'indeterminate' : false;

  const handleSelectAllChange = useCallback(
    (checked: boolean | 'indeterminate') => {
      if (checked === true) {
        setSelectedKeys(selectAllPatientDriveItemKeys(visibleItemKeys));
        return;
      }

      setSelectedKeys([]);
    },
    [visibleItemKeys],
  );

  const handleToggleSelection = useCallback((itemKey: PatientDriveItemKey) => {
    setSelectedKeys((current) => togglePatientDriveItemSelection(current, itemKey));
  }, []);

  const enqueueUpload = useCallback(
    async (file: File) => {
      const validation = validatePatientFile(file);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }

      if (!storeId) {
        toast.error('Loja não selecionada.');
        return;
      }

      const taskId = crypto.randomUUID();
      setUploadQueue((prev) => [
        ...prev,
        { id: taskId, fileName: file.name, sizeBytes: file.size, status: 'uploading', progress: 0 },
      ]);

      try {
        await uploadFileMutation.mutateAsync({
          folderId: currentFolderId,
          file,
        });

        setUploadQueue((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: 'success', progress: 100 } : task,
          ),
        );
      } catch (error) {
        const message = getPatientFilesMutationErrorMessage(error);
        setUploadQueue((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, status: 'error', progress: 0, errorMessage: message }
              : task,
          ),
        );
      }
    },
    [currentFolderId, storeId, uploadFileMutation],
  );

  const handleNewAction = useCallback((action: PatientFilesNewAction) => {
    switch (action) {
      case 'create-folder':
        setCreateFolderOpen(true);
        break;
      case 'upload-image':
        imageInputRef.current?.click();
        break;
      case 'upload-file':
        fileInputRef.current?.click();
        break;
      case 'take-photo':
        setCameraOpen(true);
        break;
    }
  }, []);

  const handleCreateFolder = useCallback(
    async (name: string) => {
      if (!storeId) {
        toast.error('Loja não selecionada.');
        return;
      }

      try {
        await createFolderMutation.mutateAsync({
          parentId: currentFolderId,
          name,
        });
        toast.success('Pasta criada com sucesso.');
      } catch (error) {
        toast.error(getPatientFilesMutationErrorMessage(error));
        throw error;
      }
    },
    [createFolderMutation, currentFolderId, storeId],
  );

  const handleOpenFile = useCallback((file: PatientFile) => {
    if (file.kind === 'image' && file.previewUrl) {
      setPreviewImageId(file.id);
      return;
    }

    if (file.contentUrl) {
      window.open(file.contentUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    toast.info('Visualização de arquivo indisponível.');
  }, []);

  const handleFolderAction = useCallback(
    (folder: PatientFolder, action: PatientDriveItemAction) => {
      switch (action) {
        case 'open':
          setCurrentFolderId(folder.id);
          break;
        case 'rename':
          setRenamingItem({ type: 'folder', item: folder });
          break;
        case 'move':
          setMovingItem({ type: 'folder', item: folder });
          break;
        case 'delete':
          setDeletingItem({ type: 'folder', item: folder });
          break;
      }
    },
    [],
  );

  const handleFileAction = useCallback(
    (file: PatientFile, action: PatientDriveItemAction) => {
      switch (action) {
        case 'open':
          handleOpenFile(file);
          break;
        case 'download': {
          const downloaded = downloadPatientFile(file);
          if (downloaded) {
            toast.success('Download iniciado.');
          } else {
            toast.info('Download indisponível para este arquivo.');
          }
          break;
        }
        case 'rename':
          setRenamingItem({ type: 'file', item: file });
          break;
        case 'move':
          setMovingItem({ type: 'file', item: file });
          break;
        case 'delete':
          setDeletingItem({ type: 'file', item: file });
          break;
      }
    },
    [handleOpenFile],
  );

  const handleRename = useCallback(
    async (name: string) => {
      if (!storeId || !renamingItem) return;

      try {
        if (renamingItem.type === 'folder') {
          await renameFolderMutation.mutateAsync({
            folderId: renamingItem.item.id,
            name,
          });
        } else {
          await renameFileMutation.mutateAsync({
            fileId: renamingItem.item.id,
            name,
          });
        }
        toast.success('Nome atualizado com sucesso.');
      } catch (error) {
        toast.error(getPatientFilesMutationErrorMessage(error));
        throw error;
      }
    },
    [renameFileMutation, renameFolderMutation, renamingItem, storeId],
  );

  const handleMove = useCallback(
    async (destinationId: string | null) => {
      if (!storeId || !movingItem) return;

      try {
        if (movingItem.type === 'folder') {
          await moveFolderMutation.mutateAsync({
            folderId: movingItem.item.id,
            parentId: destinationId,
          });
        } else {
          await moveFileMutation.mutateAsync({
            fileId: movingItem.item.id,
            folderId: destinationId,
          });
        }
        toast.success('Item movido com sucesso.');
      } catch (error) {
        toast.error(getPatientFilesMutationErrorMessage(error));
        throw error;
      }
    },
    [moveFileMutation, moveFolderMutation, movingItem, storeId],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!storeId || !deletingItem) return;

    try {
      if (deletingItem.type === 'folder') {
        await deleteFolderMutation.mutateAsync(deletingItem.item.id);
        if (currentFolderId === deletingItem.item.id) {
          setCurrentFolderId(deletingItem.item.parentId);
        }
      } else {
        await deleteFileMutation.mutateAsync(deletingItem.item.id);
      }
      toast.success('Item excluído com sucesso.');
      setDeletingItem(null);
    } catch (error) {
      toast.error(getPatientFilesMutationErrorMessage(error));
    }
  }, [currentFolderId, deleteFileMutation, deleteFolderMutation, deletingItem, storeId]);

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) void enqueueUpload(file);
    },
    [enqueueUpload],
  );

  useEffect(() => {
    clearSearch();
    setSelectedKeys([]);
    setPreviewImageId(null);
  }, [clearSearch, currentFolderId]);

  useEffect(() => {
    setSelectedKeys((current) => {
      const next = current.filter((key) => visibleItemKeys.includes(key));
      if (
        next.length === current.length &&
        next.every((key, index) => key === current[index])
      ) {
        return current;
      }
      return next;
    });
  }, [visibleItemKeys]);

  useEffect(() => {
    if (!previewImageId) return;
    if (!previewImages.some((file) => file.id === previewImageId)) {
      setPreviewImageId(null);
    }
  }, [previewImageId, previewImages]);

  const handlePreviewDownload = useCallback((file: PatientFile) => {
    const downloaded = downloadPatientFile(file);
    if (downloaded) {
      toast.success('Download iniciado.');
      return;
    }
    toast.info('Download indisponível para este arquivo.');
  }, []);

  const handlePreviewEdit = useCallback((file: PatientFile) => {
    setPreviewImageId(null);
    setRenamingItem({ type: 'file', item: file });
  }, []);

  const handlePreviewDelete = useCallback((file: PatientFile) => {
    setPreviewImageId(null);
    setDeletingItem({ type: 'file', item: file });
  }, []);

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-4">
        <PatientFilesToolbar
          search={search}
          onSearchChange={handleSearchChange}
          onNewAction={handleNewAction}
          showSelectAll={hasVisibleItems}
          selectAllState={selectAllState}
          onSelectAllChange={handleSelectAllChange}
        />

        <PatientFilesBreadcrumb items={breadcrumbItems} onNavigate={setCurrentFolderId} />

        <PatientFilesGrid
          folders={filteredFolders}
          files={filteredFiles}
          selectedKeys={selectedKeys}
          onToggleSelection={handleToggleSelection}
          onOpenFolder={setCurrentFolderId}
          onOpenFile={handleOpenFile}
          onFolderAction={handleFolderAction}
          onFileAction={handleFileAction}
          emptyMessage={emptyMessage}
        />
      </div>

      <PatientFileUploadQueue tasks={uploadQueue} onDismiss={() => setUploadQueue([])} />

      <PatientFileImagePreviewDialog
        open={previewImage !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewImageId(null);
        }}
        images={previewImages}
        activeImageId={previewImageId}
        onActiveImageChange={setPreviewImageId}
        onDownload={handlePreviewDownload}
        onEdit={handlePreviewEdit}
        onDelete={handlePreviewDelete}
      />

      <input
        ref={imageInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="sr-only"
        onChange={handleFileInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        onChange={handleFileInputChange}
      />

      <PatientCreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onCreate={handleCreateFolder}
      />

      <PatientCameraCaptureDialog
        open={cameraOpen}
        onOpenChange={setCameraOpen}
        onCapture={(file) => void enqueueUpload(file)}
      />

      <PatientRenameDriveItemDialog
        open={renamingItem !== null}
        onOpenChange={(open) => {
          if (!open) setRenamingItem(null);
        }}
        initialName={renamingItem?.item.name ?? ''}
        onRename={handleRename}
      />

      <PatientMoveDriveItemDialog
        open={movingItem !== null}
        onOpenChange={(open) => {
          if (!open) setMovingItem(null);
        }}
        itemName={movingItem?.item.name ?? ''}
        destinations={moveDestinations}
        isLoading={moveDestinationsQuery.isLoading}
        onMove={handleMove}
      />

      <ConfirmDialog
        open={deletingItem !== null}
        onOpenChange={(open) => {
          if (!open && !deleteFolderMutation.isPending && !deleteFileMutation.isPending) {
            setDeletingItem(null);
          }
        }}
        title="Excluir item"
        description={
          deletingItem
            ? `Tem certeza que deseja excluir "${deletingItem.item.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={deleteFolderMutation.isPending || deleteFileMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
