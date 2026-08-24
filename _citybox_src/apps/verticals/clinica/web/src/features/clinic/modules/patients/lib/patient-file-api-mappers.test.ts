import { describe, expect, it } from 'vitest';
import { toPatientFile, toPatientFileContentUrl } from './patient-file-api-mappers';

describe('patient file api mappers', () => {
  it('builds proxy content url for patient files', () => {
    expect(toPatientFileContentUrl('store-1', 'patient-1', 'file-1')).toBe(
      '/api/proxy/clinica/v1/patients/patient-1/files/file-1/content?storeId=store-1',
    );
  });

  it('maps image files with preview and content urls', () => {
    const file = toPatientFile(
      {
        id: 'file-1',
        patientId: 'patient-1',
        folderId: null,
        name: 'foto.png',
        mimeType: 'image/png',
        sizeBytes: 1200,
        kind: 'image',
        createdAt: '2026-07-07T12:00:00.000Z',
      },
      'store-1',
    );

    expect(file.previewUrl).toContain('/api/proxy/clinica/v1/patients/patient-1/files/file-1/content');
    expect(file.contentUrl).toBe(file.previewUrl);
  });

  it('maps non-image files with content url only', () => {
    const file = toPatientFile(
      {
        id: 'file-2',
        patientId: 'patient-1',
        folderId: null,
        name: 'laudo.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2200,
        kind: 'file',
        createdAt: '2026-07-07T12:00:00.000Z',
      },
      'store-1',
    );

    expect(file.previewUrl).toBeUndefined();
    expect(file.contentUrl).toContain('/api/proxy/clinica/v1/patients/patient-1/files/file-2/content');
  });
});
