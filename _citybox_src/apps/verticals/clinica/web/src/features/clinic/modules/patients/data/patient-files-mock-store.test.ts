import { afterEach, describe, expect, it } from 'vitest';
import {
  addPatientFileToStore,
  buildPatientFolderBreadcrumb,
  createPatientFolderInStore,
  listPatientDriveItems,
  resetPatientFilesStore,
} from '../data/patient-files-mock-store';

const PATIENT_ID = 'patient-test-1';

afterEach(() => {
  resetPatientFilesStore();
});

describe('patient-files-mock-store', () => {
  it('creates folder in current directory', () => {
    const folder = createPatientFolderInStore({
      patientId: PATIENT_ID,
      parentId: null,
      name: 'Exames',
    });

    const items = listPatientDriveItems(PATIENT_ID, null);
    expect(items.folders).toEqual([folder]);
    expect(items.files).toEqual([]);
  });

  it('lists nested folders and files separately by parent', () => {
    const parent = createPatientFolderInStore({
      patientId: PATIENT_ID,
      parentId: null,
      name: 'Exames',
    });

    createPatientFolderInStore({
      patientId: PATIENT_ID,
      parentId: parent.id,
      name: '2026',
    });

    const file = new File(['content'], 'resultado.pdf', { type: 'application/pdf' });
    addPatientFileToStore({
      patientId: PATIENT_ID,
      folderId: parent.id,
      file,
    });

    expect(listPatientDriveItems(PATIENT_ID, null).folders).toHaveLength(1);
    expect(listPatientDriveItems(PATIENT_ID, parent.id).folders).toHaveLength(1);
    expect(listPatientDriveItems(PATIENT_ID, parent.id).files).toHaveLength(1);
    expect(listPatientDriveItems(PATIENT_ID, parent.id).files[0]?.name).toBe('resultado.pdf');
  });

  it('builds breadcrumb trail from root to current folder', () => {
    const parent = createPatientFolderInStore({
      patientId: PATIENT_ID,
      parentId: null,
      name: 'Exames',
    });
    const child = createPatientFolderInStore({
      patientId: PATIENT_ID,
      parentId: parent.id,
      name: '2026',
    });

    expect(buildPatientFolderBreadcrumb(PATIENT_ID, child.id)).toEqual([
      { id: null, name: 'Arquivos' },
      { id: parent.id, name: 'Exames' },
      { id: child.id, name: '2026' },
    ]);
  });
});
