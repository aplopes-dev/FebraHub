import type { PatientFile, PatientFolder } from '../types/patient-file';

export function filterPatientFolders(
  folders: PatientFolder[],
  search: string,
): PatientFolder[] {
  const query = search.trim().toLowerCase();
  if (!query) return folders;
  return folders.filter((folder) => folder.name.toLowerCase().includes(query));
}

export function filterPatientFiles(files: PatientFile[], search: string): PatientFile[] {
  const query = search.trim().toLowerCase();
  if (!query) return files;
  return files.filter((file) => file.name.toLowerCase().includes(query));
}
