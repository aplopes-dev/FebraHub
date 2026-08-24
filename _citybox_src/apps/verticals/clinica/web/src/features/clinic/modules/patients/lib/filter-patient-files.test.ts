import { describe, expect, it } from 'vitest';
import { filterPatientFiles, filterPatientFolders } from './filter-patient-files';
import type { PatientFile, PatientFolder } from '../types/patient-file';

const folders: PatientFolder[] = [
  {
    id: 'f1',
    patientId: 'p1',
    parentId: null,
    name: 'Exames',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'f2',
    patientId: 'p1',
    parentId: null,
    name: 'Consentimentos',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

const files: PatientFile[] = [
  {
    id: 'file1',
    patientId: 'p1',
    folderId: null,
    name: 'laudo-externo.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 850_000,
    kind: 'file',
    createdAt: '2026-01-03T00:00:00.000Z',
  },
];

describe('filterPatientFolders', () => {
  it('returns all folders when search is empty', () => {
    expect(filterPatientFolders(folders, '')).toHaveLength(2);
  });

  it('filters folders by name case-insensitively', () => {
    expect(filterPatientFolders(folders, 'exame')).toEqual([folders[0]]);
  });
});

describe('filterPatientFiles', () => {
  it('filters files by name case-insensitively', () => {
    expect(filterPatientFiles(files, 'LAUDO')).toEqual([files[0]]);
  });
});
