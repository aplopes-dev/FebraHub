import { InvalidPatientFileError } from '../../domain/errors/invalid-patient-file.error';

export const PATIENT_FILE_MAX_SIZE_BYTES = 20 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export class PatientFileMimeValidator {
  static isAllowedMime(mimeType: string): boolean {
    if (mimeType.startsWith('image/')) {
      return true;
    }
    return ALLOWED_MIME_TYPES.has(mimeType);
  }

  static inferKind(mimeType: string): 'image' | 'file' {
    return mimeType.startsWith('image/') ? 'image' : 'file';
  }

  static validate(
    buffer: Buffer,
    declaredMimeType: string,
    context: string,
  ): string {
    if (!buffer?.length) {
      throw new InvalidPatientFileError(context, 'empty');
    }
    if (buffer.length > PATIENT_FILE_MAX_SIZE_BYTES) {
      throw new InvalidPatientFileError(context, 'too_large');
    }

    const normalized =
      declaredMimeType === 'image/jpg' ? 'image/jpeg' : declaredMimeType;
    if (!PatientFileMimeValidator.isAllowedMime(normalized)) {
      throw new InvalidPatientFileError(context, 'mime');
    }

    return normalized;
  }
}
