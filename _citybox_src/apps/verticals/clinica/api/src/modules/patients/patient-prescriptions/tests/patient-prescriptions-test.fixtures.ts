import { InMemoryPatientRepository } from '../../tests/in-memory-patient.repository';
import {
  CATEGORY_A,
  seedMinimalPatient,
  STORE_A,
} from '../../tests/patients-test.fixtures';
import { ResolveProfessionalCouncilService } from '../../../members/application/services/resolve-professional-council.service';
import { InMemoryMemberRepository } from '../../../members/tests/in-memory-member.repository';
import { Organization } from '../../../tenancy/domain/entities/organization.entity';
import { InMemoryOrganizationRepository } from '../../../tenancy/tests/in-memory-tenancy.repositories';
import { AssertPatientExistsService } from '../application/services/assert-patient-exists.service';
import { CreatePatientPrescriptionUseCase } from '../application/use-cases/create-patient-prescription/create-patient-prescription.use-case';
import { DeletePatientPrescriptionUseCase } from '../application/use-cases/delete-patient-prescription/delete-patient-prescription.use-case';
import { ListPatientPrescriptionsUseCase } from '../application/use-cases/list-patient-prescriptions/list-patient-prescriptions.use-case';
import { ValidatePatientPrescriptionService } from '../application/services/validate-patient-prescription.service';
import { InMemoryPatientPrescriptionRepository } from './in-memory-patient-prescription.repository';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const PRESCRIPTION_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const PROFESSIONAL_A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

export type PatientPrescriptionsTestHarness = {
  patientRepo: InMemoryPatientRepository;
  prescriptionRepo: InMemoryPatientPrescriptionRepository;
  memberRepo: InMemoryMemberRepository;
  createPatientPrescription: CreatePatientPrescriptionUseCase;
  listPatientPrescriptions: ListPatientPrescriptionsUseCase;
  deletePatientPrescription: DeletePatientPrescriptionUseCase;
};

export function createPatientPrescriptionsTestHarness(): PatientPrescriptionsTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const prescriptionRepo = new InMemoryPatientPrescriptionRepository();
  const memberRepo = new InMemoryMemberRepository();
  const organizationRepo = new InMemoryOrganizationRepository();
  organizationRepo.items.push(
    Organization.create(
      {
        storeId: STORE_A,
        name: 'Clínica Teste',
        status: 'active',
        clinicStrand: 'odontologia',
        plan: {
          planId: null,
          tier: null,
          maxClinics: null,
          maxUsers: null,
        },
        overQuota: false,
        suspendedReason: null,
        platformUpdatedAt: null,
        syncedAt: new Date(),
      },
      'org-test',
    ),
  );
  const assertPatientExists = new AssertPatientExistsService(patientRepo);
  const validatePrescription = new ValidatePatientPrescriptionService();
  const resolveProfessionalCouncil = new ResolveProfessionalCouncilService(
    memberRepo,
    organizationRepo,
  );

  return {
    patientRepo,
    prescriptionRepo,
    memberRepo,
    createPatientPrescription: new CreatePatientPrescriptionUseCase(
      prescriptionRepo,
      patientRepo,
      assertPatientExists,
      validatePrescription,
      resolveProfessionalCouncil,
    ),
    listPatientPrescriptions: new ListPatientPrescriptionsUseCase(
      prescriptionRepo,
      assertPatientExists,
    ),
    deletePatientPrescription: new DeletePatientPrescriptionUseCase(
      prescriptionRepo,
      assertPatientExists,
    ),
  };
}

export function seedPatient(
  harness: PatientPrescriptionsTestHarness,
  patientId: string = PATIENT_A,
): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, patientId, CATEGORY_A);
}

export async function seedProfessional(
  harness: PatientPrescriptionsTestHarness,
  professionalId: string = PROFESSIONAL_A,
): Promise<void> {
  await harness.memberRepo.create({
    id: professionalId,
    organizationId: 'org-test',
    keycloakSub: `sub-${professionalId}`,
    username: `user-${professionalId}`,
    email: null,
    firstName: 'João',
    lastName: 'Silva',
    hasPassword: true,
    clinics: [{ clinicId: STORE_A, role: 'dentista', permissions: [] }],
  });
}

export const SAMPLE_PRESCRIPTION_INPUT = {
  professionalId: PROFESSIONAL_A,
  professionalName: 'Dr. João',
  clinicName: 'Clínica Teste',
  issuedDate: '2026-07-06',
  councilType: 'CRO' as const,
  councilNumber: '12345',
  councilUf: 'BA',
  items: [
    {
      id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      name: 'Dipirona',
      quantity: '1',
      measure: 'Comprimido' as const,
      posology: '8/8h',
      notes: '',
    },
  ],
};
