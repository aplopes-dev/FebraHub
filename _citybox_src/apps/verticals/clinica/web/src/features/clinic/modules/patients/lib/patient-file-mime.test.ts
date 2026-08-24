import { describe, expect, it } from 'vitest';
import {
  inferPatientFileKind,
  isAllowedPatientFileMime,
  PATIENT_FILE_MAX_SIZE_BYTES,
  validatePatientFile,
  validatePatientFolderName,
} from './patient-file-mime';

describe('isAllowedPatientFileMime', () => {
  it('accepts images and common document types', () => {
    expect(isAllowedPatientFileMime('image/jpeg')).toBe(true);
    expect(isAllowedPatientFileMime('application/pdf')).toBe(true);
    expect(isAllowedPatientFileMime('text/plain')).toBe(true);
  });

  it('rejects unknown mime types', () => {
    expect(isAllowedPatientFileMime('application/zip')).toBe(false);
  });
});

describe('inferPatientFileKind', () => {
  it('classifies image mime as image kind', () => {
    expect(inferPatientFileKind('image/png')).toBe('image');
    expect(inferPatientFileKind('application/pdf')).toBe('file');
  });
});

describe('validatePatientFile', () => {
  it('rejects files larger than 20 MB', () => {
    const file = new File([new Uint8Array(PATIENT_FILE_MAX_SIZE_BYTES + 1)], 'big.pdf', {
      type: 'application/pdf',
    });
    const result = validatePatientFile(file);
    expect(result.valid).toBe(false);
  });

  it('rejects disallowed mime types', () => {
    const file = new File(['x'], 'archive.zip', { type: 'application/zip' });
    const result = validatePatientFile(file);
    expect(result.valid).toBe(false);
  });

  it('accepts valid files', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    expect(validatePatientFile(file)).toEqual({ valid: true });
  });
});

describe('validatePatientFolderName', () => {
  it('requires non-empty trimmed name', () => {
    expect(validatePatientFolderName('   ').valid).toBe(false);
  });

  it('rejects slash in folder name', () => {
    expect(validatePatientFolderName('Exames/2026').valid).toBe(false);
  });

  it('accepts valid folder name', () => {
    expect(validatePatientFolderName(' Exames ')).toEqual({ valid: true });
  });
});
