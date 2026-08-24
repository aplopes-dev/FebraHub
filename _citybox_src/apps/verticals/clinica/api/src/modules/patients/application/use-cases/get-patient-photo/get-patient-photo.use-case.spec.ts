import { GetPatientPhotoUseCase } from './get-patient-photo.use-case';
import { UploadPatientPhotoUseCase } from '../upload-patient-photo/upload-patient-photo.use-case';
import { CreatePatientUseCase } from '../create-patient/create-patient.use-case';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { ValidatePatientReferencesService } from '../../services/validate-patient-references.service';
import { PatientNotFoundError } from '../../../domain/errors/patient-not-found.error';
import { InMemoryPatientRepository } from '../../../tests/in-memory-patient.repository';
import { InMemoryPatientCategoryRepository } from '../../../patient-categories/tests/in-memory-patient-category.repository';
import { InMemoryClinicPlanRepository } from '../../../../clinic-plans/tests/in-memory-clinic-plan.repository';
import { InMemoryPatientReferralOriginRepository } from '../../../patient-referral-origins/tests/in-memory-patient-referral-origin.repository';
import { InMemoryExternalReferralProfessionalRepository } from '../../../patient-external-professionals/tests/in-memory-external-referral-professional.repository';

const STORE_ID = '11111111-1111-4111-8111-111111111111';
const CATEGORY_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const PNG_BUFFER = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

describe('GetPatientPhotoUseCase', () => {
  let patientRepo: InMemoryPatientRepository;
  let storage: InMemoryObjectStorage;
  let createPatient: CreatePatientUseCase;
  let uploadPhoto: UploadPatientPhotoUseCase;
  let getPhoto: GetPatientPhotoUseCase;

  beforeEach(() => {
    patientRepo = new InMemoryPatientRepository();
    const categoryRepo = new InMemoryPatientCategoryRepository();
    const planRepo = new InMemoryClinicPlanRepository();

    const category = categoryRepo.seed(
      {
        storeId: STORE_ID,
        name: 'Particular',
        colorId: '#3b82f6',
        isProtected: true,
      },
      CATEGORY_ID,
    );
    patientRepo.seedCategory(category.id, {
      name: 'Particular',
      colorId: '#3b82f6',
    });

    const validateReferences = new ValidatePatientReferencesService(
      categoryRepo,
      new InMemoryPatientReferralOriginRepository(),
      new InMemoryExternalReferralProfessionalRepository(),
      planRepo,
      patientRepo,
    );
    createPatient = new CreatePatientUseCase(patientRepo, validateReferences);
    storage = new InMemoryObjectStorage();
    uploadPhoto = new UploadPatientPhotoUseCase(patientRepo, storage);
    getPhoto = new GetPatientPhotoUseCase(patientRepo, storage);
  });

  it('gets photo stream from storage', async () => {
    const created = await createPatient.execute({
      storeId: STORE_ID,
      input: { name: 'Ana', gender: 'female', categoryId: CATEGORY_ID },
    });

    await uploadPhoto.execute({
      storeId: STORE_ID,
      patientId: created.patient.id,
      buffer: PNG_BUFFER,
      declaredMimeType: 'image/png',
    });

    const result = await getPhoto.execute({
      storeId: STORE_ID,
      patientId: created.patient.id,
    });

    expect(result.mimeType).toBe('image/png');
    expect(result.buffer.equals(PNG_BUFFER)).toBe(true);
  });

  it('throws when patient has no photo', async () => {
    const created = await createPatient.execute({
      storeId: STORE_ID,
      input: { name: 'Ana', gender: 'female', categoryId: CATEGORY_ID },
    });

    await expect(
      getPhoto.execute({
        storeId: STORE_ID,
        patientId: created.patient.id,
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
