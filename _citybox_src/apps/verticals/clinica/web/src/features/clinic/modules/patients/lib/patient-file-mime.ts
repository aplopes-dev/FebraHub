export const PATIENT_FILE_MAX_SIZE_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ['image/'] as const;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export type PatientFileValidationResult =
  | { valid: true }
  | { valid: false; message: string };

export function isAllowedPatientFileMime(mimeType: string): boolean {
  if (ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))) {
    return true;
  }
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function inferPatientFileKind(mimeType: string): 'image' | 'file' {
  return mimeType.startsWith('image/') ? 'image' : 'file';
}

export function validatePatientFile(file: File): PatientFileValidationResult {
  if (file.size > PATIENT_FILE_MAX_SIZE_BYTES) {
    return { valid: false, message: 'O arquivo deve ter no máximo 20 MB.' };
  }

  if (!isAllowedPatientFileMime(file.type)) {
    return {
      valid: false,
      message: 'Tipo de arquivo não permitido. Envie imagem, PDF, Word, Excel ou texto.',
    };
  }

  return { valid: true };
}

export function validatePatientFolderName(name: string): PatientFileValidationResult {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, message: 'Informe o nome da pasta.' };
  }

  if (trimmed.includes('/')) {
    return { valid: false, message: 'O nome da pasta não pode conter "/".' };
  }

  return { valid: true };
}
