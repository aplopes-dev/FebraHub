'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import {
  createPatientFolder,
  deletePatientFile,
  deletePatientFolder,
  getPatientDriveBreadcrumb,
  getPatientMoveDestinations,
  listPatientDrive,
  movePatientFile,
  movePatientFolder,
  renamePatientFile,
  renamePatientFolder,
  uploadPatientFile,
} from '../services/patient-files.service';
import { patientFileKeys } from './query-keys';

export function usePatientDriveQuery(
  patientId: string | null,
  folderId: string | null,
  search: string,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: patientFileKeys.drive(storeId ?? '', patientId ?? '', folderId, search),
    queryFn: () => listPatientDrive(storeId!, patientId!, folderId, search),
    enabled: Boolean(storeId) && Boolean(patientId),
    placeholderData: keepPreviousData,
  });
}

export function usePatientDriveBreadcrumbQuery(
  patientId: string | null,
  folderId: string | null,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: patientFileKeys.breadcrumb(storeId ?? '', patientId ?? '', folderId),
    queryFn: () => getPatientDriveBreadcrumb(storeId!, patientId!, folderId),
    enabled: Boolean(storeId) && Boolean(patientId),
  });
}

export function usePatientMoveDestinationsQuery(
  patientId: string | null,
  excludeFolderSubtreeId: string | null,
  enabled: boolean,
) {
  const { storeId } = useStore();

  return useQuery({
    queryKey: patientFileKeys.moveDestinations(
      storeId ?? '',
      patientId ?? '',
      excludeFolderSubtreeId,
    ),
    queryFn: () =>
      getPatientMoveDestinations(storeId!, patientId!, excludeFolderSubtreeId ?? undefined),
    enabled: Boolean(storeId) && Boolean(patientId) && enabled,
  });
}

export function usePatientFilesMutations(patientId: string | null) {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    if (!storeId || !patientId) return;
    void queryClient.invalidateQueries({
      queryKey: patientFileKeys.all(storeId, patientId),
    });
  };

  const createFolderMutation = useMutation({
    mutationFn: (input: { parentId: string | null; name: string }) =>
      createPatientFolder(storeId!, patientId!, input.parentId, input.name),
    onSuccess: invalidate,
  });

  const uploadFileMutation = useMutation({
    mutationFn: (input: { folderId: string | null; file: File }) =>
      uploadPatientFile(storeId!, patientId!, input.folderId, input.file),
    onSuccess: invalidate,
  });

  const renameFolderMutation = useMutation({
    mutationFn: (input: { folderId: string; name: string }) =>
      renamePatientFolder(storeId!, patientId!, input.folderId, input.name),
    onSuccess: invalidate,
  });

  const renameFileMutation = useMutation({
    mutationFn: (input: { fileId: string; name: string }) =>
      renamePatientFile(storeId!, patientId!, input.fileId, input.name),
    onSuccess: invalidate,
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) =>
      deletePatientFolder(storeId!, patientId!, folderId),
    onSuccess: invalidate,
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => deletePatientFile(storeId!, patientId!, fileId),
    onSuccess: invalidate,
  });

  const moveFolderMutation = useMutation({
    mutationFn: (input: { folderId: string; parentId: string | null }) =>
      movePatientFolder(storeId!, patientId!, input.folderId, input.parentId),
    onSuccess: invalidate,
  });

  const moveFileMutation = useMutation({
    mutationFn: (input: { fileId: string; folderId: string | null }) =>
      movePatientFile(storeId!, patientId!, input.fileId, input.folderId),
    onSuccess: invalidate,
  });

  return {
    createFolderMutation,
    uploadFileMutation,
    renameFolderMutation,
    renameFileMutation,
    deleteFolderMutation,
    deleteFileMutation,
    moveFolderMutation,
    moveFileMutation,
  };
}

export function getPatientFilesMutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicaApiError) {
    return error.message;
  }

  return 'Não foi possível concluir a operação. Tente novamente.';
}
