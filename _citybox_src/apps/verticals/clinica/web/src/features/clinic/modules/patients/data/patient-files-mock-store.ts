import { useSyncExternalStore } from 'react';
import { inferPatientFileKind } from '../lib/patient-file-mime';
import type { PatientDriveListResult, PatientFile, PatientFolder } from '../types/patient-file';

type PatientFilesStore = {
  folders: PatientFolder[];
  files: PatientFile[];
};

const store: PatientFilesStore = {
  folders: [],
  files: [],
};

let version = 0;
const listeners = new Set<() => void>();

function emitChange(): void {
  version += 1;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): number {
  return version;
}

export function usePatientFilesStoreVersion(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function resetPatientFilesStore(): void {
  store.folders = [];
  store.files = [];
  emitChange();
}

export function listPatientDriveItems(
  patientId: string,
  folderId: string | null,
): PatientDriveListResult {
  const folders = store.folders.filter(
    (folder) => folder.patientId === patientId && folder.parentId === folderId,
  );
  const files = store.files.filter(
    (file) => file.patientId === patientId && file.folderId === folderId,
  );

  return {
    folders: [...folders].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    files: [...files].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
  };
}

export function createPatientFolderInStore(input: {
  patientId: string;
  parentId: string | null;
  name: string;
}): PatientFolder {
  const folder: PatientFolder = {
    id: crypto.randomUUID(),
    patientId: input.patientId,
    parentId: input.parentId,
    name: input.name.trim(),
    createdAt: new Date().toISOString(),
  };

  store.folders = [...store.folders, folder];
  emitChange();
  return folder;
}

export function addPatientFileToStore(input: {
  patientId: string;
  folderId: string | null;
  file: File;
  previewUrl?: string;
}): PatientFile {
  const record: PatientFile = {
    id: crypto.randomUUID(),
    patientId: input.patientId,
    folderId: input.folderId,
    name: input.file.name,
    mimeType: input.file.type || 'application/octet-stream',
    sizeBytes: input.file.size,
    kind: inferPatientFileKind(input.file.type),
    previewUrl: input.previewUrl,
    createdAt: new Date().toISOString(),
  };

  store.files = [...store.files, record];
  emitChange();
  return record;
}

export function getPatientFolderById(folderId: string): PatientFolder | null {
  return store.folders.find((folder) => folder.id === folderId) ?? null;
}

export function buildPatientFolderBreadcrumb(
  patientId: string,
  folderId: string | null,
): Array<{ id: string | null; name: string }> {
  const trail: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Arquivos' }];

  if (!folderId) return trail;

  const chain: PatientFolder[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = store.folders.find(
      (item) => item.id === currentId && item.patientId === patientId,
    );
    if (!folder) break;
    chain.unshift(folder);
    currentId = folder.parentId;
  }

  return [...trail, ...chain.map((folder) => ({ id: folder.id, name: folder.name }))];
}

function collectDescendantFolderIds(folderId: string): Set<string> {
  const ids = new Set<string>([folderId]);

  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of store.folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    }
  }

  return ids;
}

export function renamePatientFolderInStore(folderId: string, name: string): void {
  store.folders = store.folders.map((folder) =>
    folder.id === folderId ? { ...folder, name: name.trim() } : folder,
  );
  emitChange();
}

export function renamePatientFileInStore(fileId: string, name: string): void {
  store.files = store.files.map((file) =>
    file.id === fileId ? { ...file, name: name.trim() } : file,
  );
  emitChange();
}

export function deletePatientFolderInStore(folderId: string): void {
  const folderIds = collectDescendantFolderIds(folderId);
  store.files = store.files.filter((file) => !file.folderId || !folderIds.has(file.folderId));
  store.folders = store.folders.filter((folder) => !folderIds.has(folder.id));
  emitChange();
}

export function deletePatientFileInStore(fileId: string): void {
  store.files = store.files.filter((file) => file.id !== fileId);
  emitChange();
}

export function movePatientFolderInStore(folderId: string, targetParentId: string | null): void {
  const invalidTargets = collectDescendantFolderIds(folderId);
  if (targetParentId !== null && invalidTargets.has(targetParentId)) {
    return;
  }

  store.folders = store.folders.map((folder) =>
    folder.id === folderId ? { ...folder, parentId: targetParentId } : folder,
  );
  emitChange();
}

export function movePatientFileInStore(fileId: string, targetFolderId: string | null): void {
  store.files = store.files.map((file) =>
    file.id === fileId ? { ...file, folderId: targetFolderId } : file,
  );
  emitChange();
}

export function getPatientFolderDescendantIds(folderId: string): string[] {
  return [...collectDescendantFolderIds(folderId)];
}

export function listPatientMoveDestinations(
  patientId: string,
  excludeFolderIds: string[] = [],
): Array<{ id: string | null; label: string }> {
  const excluded = new Set(excludeFolderIds);

  const destinations = store.folders
    .filter((folder) => folder.patientId === patientId && !excluded.has(folder.id))
    .map((folder) => {
      const trail = buildPatientFolderBreadcrumb(patientId, folder.id);
      return {
        id: folder.id,
        label: trail.map((item) => item.name).join(' / '),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  return [{ id: null, label: 'Arquivos' }, ...destinations];
}
