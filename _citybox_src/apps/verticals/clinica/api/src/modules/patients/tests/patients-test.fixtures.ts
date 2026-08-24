import { CreatePatientUseCase } from '../application/use-cases/create-patient/create-patient.use-case';
import { ValidatePatientReferencesService } from '../application/services/validate-patient-references.service';
import { ClinicPlan } from '../../clinic-plans/domain/entities/clinic-plan.entity';
import { InMemoryClinicPlanRepository } from '../../clinic-plans/tests/in-memory-clinic-plan.repository';
import { InMemoryPatientCategoryRepository } from '../patient-categories/tests/in-memory-patient-category.repository';
import { InMemoryPatientRepository } from './in-memory-patient.repository';
import { InMemoryPatientReferralOriginRepository } from '../patient-referral-origins/tests/in-memory-patient-referral-origin.repository';
import { InMemoryExternalReferralProfessionalRepository } from '../patient-external-professionals/tests/in-memory-external-referral-professional.repository';
import { Patient } from '../domain/entities/patient.entity';

export const STORE_A = '11111111-1111-1111-1111-111111111111';
export const STORE_B = '22222222-2222-2222-2222-222222222222';
export const VALID_CPF = '52998224725';
export const VALID_CPF_2 = '11144477735';
export const CATEGORY_A = '11111111-1111-4111-8111-111111111111';
export const CATEGORY_B = '22222222-2222-4222-8222-222222222222';
export const PLAN_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

export type PatientsTestHarness = {
  patientRepo: InMemoryPatientRepository;
  categoryRepo: InMemoryPatientCategoryRepository;
  planRepo: InMemoryClinicPlanRepository;
  referralOriginRepo: InMemoryPatientReferralOriginRepository;
  externalProfessionalRepo: InMemoryExternalReferralProfessionalRepository;
  validateReferences: ValidatePatientReferencesService;
  createPatient: CreatePatientUseCase;
};

export function seedCategory(
  categoryRepo: InMemoryPatientCategoryRepository,
  patientRepo: InMemoryPatientRepository,
  storeId: string,
  id: string,
): void {
  categoryRepo.seed(
    { storeId, name: 'Particular', colorId: '#3b82f6', isProtected: true },
    id,
  );
  patientRepo.seedCategory(id, { name: 'Particular', colorId: '#3b82f6' });
}

export function seedMinimalPatient(
  patientRepo: InMemoryPatientRepository,
  storeId: string,
  patientId: string,
  categoryId: string = CATEGORY_A,
): void {
  const patient = Patient.create(
    {
      storeId,
      status: 'active',
      name: 'Maria',
      cpf: null,
      rg: '',
      birthDate: null,
      gender: 'female',
      photoObjectKey: null,
      photoMimeType: null,
      phone: '',
      landlinePhone: '',
      email: '',
      socialNetwork: '',
      medicalRecordNumber: '',
      referralOriginId: null,
      referredByPatientId: null,
      referredByMemberId: null,
      referredByMemberName: null,
      referredByExternalProfessionalId: null,
      profession: '',
      categoryId,
      guardianName: '',
      guardianBirthDate: null,
      guardianCpf: null,
      guardianPhone: '',
      guardianNotes: '',
      zipCode: '',
      street: '',
      streetNumber: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      planId: null,
      planNumber: '',
      planHolderName: '',
      planHolderCpf: null,
    },
    patientId,
  );
  void patientRepo.save(patient);
  patientRepo.seedCategory(categoryId, { name: 'Particular', colorId: '#3b82f6' });
}

export function createPatientsTestHarness(): PatientsTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const categoryRepo = new InMemoryPatientCategoryRepository();
  const planRepo = new InMemoryClinicPlanRepository();
  const referralOriginRepo = new InMemoryPatientReferralOriginRepository();
  const externalProfessionalRepo =
    new InMemoryExternalReferralProfessionalRepository();
  const validateReferences = new ValidatePatientReferencesService(
    categoryRepo,
    referralOriginRepo,
    externalProfessionalRepo,
    planRepo,
    patientRepo,
  );
  const createPatient = new CreatePatientUseCase(
    patientRepo,
    validateReferences,
  );

  seedCategory(categoryRepo, patientRepo, STORE_A, CATEGORY_A);

  const plan = ClinicPlan.create(
    {
      storeId: STORE_A,
      name: 'Plano Ouro',
      sortOrder: 1,
      status: 'active',
      isDefault: true,
      treatmentInit: null,
    },
    PLAN_A,
  );
  planRepo.save(plan);
  patientRepo.seedPlan(PLAN_A, { name: 'Plano Ouro' });

  return {
    patientRepo,
    categoryRepo,
    planRepo,
    referralOriginRepo,
    externalProfessionalRepo,
    validateReferences,
    createPatient,
  };
}
