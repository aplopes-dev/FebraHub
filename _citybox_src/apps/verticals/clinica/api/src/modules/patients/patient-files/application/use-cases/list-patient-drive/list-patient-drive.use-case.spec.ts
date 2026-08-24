import { InvalidPatientFolderMoveError } from '../../../domain/errors/invalid-patient-folder-move.error';
import {
  createPatientFilesTestHarness,
  PATIENT_A,
  seedPatient,
} from '../../../tests/patient-files-test.fixtures';
import { STORE_A } from '../../../../tests/patients-test.fixtures';

describe('ListPatientDriveUseCase', () => {
  it('lists folders and files in the current directory sorted by name', async () => {
    const harness = createPatientFilesTestHarness();
    seedPatient(harness);

    await harness.createPatientFolder.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      parentId: null,
      name: 'Zeta',
    });
    await harness.createPatientFolder.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      parentId: null,
      name: 'Alpha',
    });

    const result = await harness.listPatientDrive.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      folderId: null,
    });

    expect(result.folders.map((folder) => folder.name)).toEqual([
      'Alpha',
      'Zeta',
    ]);
  });
});

describe('MovePatientFolderUseCase', () => {
  it('rejects moving a folder into its descendant', async () => {
    const harness = createPatientFilesTestHarness();
    seedPatient(harness);

    const parent = await harness.createPatientFolder.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      parentId: null,
      name: 'Parent',
    });
    const child = await harness.createPatientFolder.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      parentId: parent.id,
      name: 'Child',
    });

    await expect(
      harness.movePatientFolder.execute({
        storeId: STORE_A,
        patientId: PATIENT_A,
        folderId: parent.id,
        parentId: child.id,
      }),
    ).rejects.toBeInstanceOf(InvalidPatientFolderMoveError);
  });
});

describe('UploadPatientFileUseCase', () => {
  it('uploads a file and stores it in object storage', async () => {
    const harness = createPatientFilesTestHarness();
    seedPatient(harness);

    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const file = await harness.uploadPatientFile.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      folderId: null,
      name: 'foto.jpg',
      buffer,
      declaredMimeType: 'image/jpeg',
    });

    expect(file.kind).toBe('image');
    expect(await harness.storage.exists(file.objectKey)).toBe(true);

    const content = await harness.getPatientFileContent.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      fileId: file.id,
    });
    expect(content.mimeType).toBe('image/jpeg');
  });
});

describe('DeletePatientFolderUseCase', () => {
  it('deletes folder tree and associated files from storage', async () => {
    const harness = createPatientFilesTestHarness();
    seedPatient(harness);

    const folder = await harness.createPatientFolder.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      parentId: null,
      name: 'Exames',
    });

    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
    const file = await harness.uploadPatientFile.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      folderId: folder.id,
      name: 'rx.jpg',
      buffer,
      declaredMimeType: 'image/jpeg',
    });

    await harness.deletePatientFolder.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      folderId: folder.id,
    });

    expect(await harness.storage.exists(file.objectKey)).toBe(false);
    const listed = await harness.listPatientDrive.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      folderId: null,
    });
    expect(listed.folders).toHaveLength(0);
  });
});

describe('GetPatientDriveBreadcrumbUseCase', () => {
  it('builds breadcrumb trail from root to current folder', async () => {
    const harness = createPatientFilesTestHarness();
    seedPatient(harness);

    const parent = await harness.createPatientFolder.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      parentId: null,
      name: 'Exames',
    });
    const child = await harness.createPatientFolder.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      parentId: parent.id,
      name: '2026',
    });

    const breadcrumb = await harness.getPatientDriveBreadcrumb.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      folderId: child.id,
    });

    expect(breadcrumb).toEqual([
      { id: null, name: 'Arquivos' },
      { id: parent.id, name: 'Exames' },
      { id: child.id, name: '2026' },
    ]);
  });
});
