import type { PatientFile, PatientFolder } from '../types/patient-file';

export type PatientDriveItemKey = `folder:${string}` | `file:${string}`;

export function toPatientFolderKey(folderId: string): PatientDriveItemKey {
  return `folder:${folderId}`;
}

export function toPatientFileKey(fileId: string): PatientDriveItemKey {
  return `file:${fileId}`;
}

export function getVisiblePatientDriveItemKeys(
  folders: readonly PatientFolder[],
  files: readonly PatientFile[],
): PatientDriveItemKey[] {
  return [
    ...folders.map((folder) => toPatientFolderKey(folder.id)),
    ...files.map((file) => toPatientFileKey(file.id)),
  ];
}

export function selectAllPatientDriveItemKeys(
  itemKeys: readonly PatientDriveItemKey[],
): PatientDriveItemKey[] {
  return [...itemKeys];
}

export function togglePatientDriveItemSelection(
  selectedKeys: readonly PatientDriveItemKey[],
  itemKey: PatientDriveItemKey,
): PatientDriveItemKey[] {
  if (selectedKeys.includes(itemKey)) {
    return selectedKeys.filter((key) => key !== itemKey);
  }

  return [...selectedKeys, itemKey];
}

export function isAllPatientDriveItemsSelected(
  allItemKeys: readonly PatientDriveItemKey[],
  selectedKeys: readonly PatientDriveItemKey[],
): boolean {
  if (allItemKeys.length === 0) {
    return false;
  }

  return allItemKeys.every((key) => selectedKeys.includes(key));
}

export function isSomePatientDriveItemsSelected(
  allItemKeys: readonly PatientDriveItemKey[],
  selectedKeys: readonly PatientDriveItemKey[],
): boolean {
  if (selectedKeys.length === 0) {
    return false;
  }

  return !isAllPatientDriveItemsSelected(allItemKeys, selectedKeys);
}
