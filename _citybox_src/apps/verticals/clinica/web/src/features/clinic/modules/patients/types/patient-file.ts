export type PatientFileKind = 'image' | 'file';

export type PatientFolder = {
  id: string;
  patientId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
};

export type PatientFile = {
  id: string;
  patientId: string;
  folderId: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  kind: PatientFileKind;
  previewUrl?: string;
  contentUrl?: string;
  createdAt: string;
};

export type PatientFolderBreadcrumb = {
  id: string | null;
  name: string;
};

export type PatientFileUploadStatus = 'uploading' | 'success' | 'error';

export type PatientFileUploadTask = {
  id: string;
  fileName: string;
  sizeBytes: number;
  status: PatientFileUploadStatus;
  progress: number;
  errorMessage?: string;
};

export type PatientDriveListResult = {
  folders: PatientFolder[];
  files: PatientFile[];
};

export type PatientDriveItemAction = 'open' | 'download' | 'rename' | 'move' | 'delete';

export type PatientDriveMoveDestination = {
  id: string | null;
  label: string;
};
