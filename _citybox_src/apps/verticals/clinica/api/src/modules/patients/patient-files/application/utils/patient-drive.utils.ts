import type { PatientFolder } from '../../domain/entities/patient-folder.entity';

export function sortDriveItemsByName<T extends { name: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export function collectDescendantFolderIds(
  folders: readonly PatientFolder[],
  rootFolderId: string,
): Set<string> {
  const ids = new Set<string>([rootFolderId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
        ids.add(folder.id);
        changed = true;
      }
    }
  }

  return ids;
}

export function isFolderDescendantOf(
  folders: readonly PatientFolder[],
  ancestorId: string,
  candidateId: string,
): boolean {
  if (ancestorId === candidateId) {
    return true;
  }
  return collectDescendantFolderIds(folders, ancestorId).has(candidateId);
}

export function buildFolderBreadcrumb(
  folders: readonly PatientFolder[],
  patientId: string,
  folderId: string | null,
): Array<{ id: string | null; name: string }> {
  const trail: Array<{ id: string | null; name: string }> = [
    { id: null, name: 'Arquivos' },
  ];

  if (!folderId) {
    return trail;
  }

  const chain: PatientFolder[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = folders.find(
      (item) => item.id === currentId && item.patientId === patientId,
    );
    if (!folder) {
      break;
    }
    chain.unshift(folder);
    currentId = folder.parentId;
  }

  return [
    ...trail,
    ...chain.map((folder) => ({ id: folder.id, name: folder.name })),
  ];
}

export function buildMoveDestinationLabel(
  folders: readonly PatientFolder[],
  patientId: string,
  folderId: string,
): string {
  return buildFolderBreadcrumb(folders, patientId, folderId)
    .map((segment) => segment.name)
    .join(' / ');
}
