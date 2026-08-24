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
import { CreatePatientCertificateUseCase } from '../application/use-cases/create-patient-certificate/create-patient-certificate.use-case';
import { DeletePatientCertificateUseCase } from '../application/use-cases/delete-patient-certificate/delete-patient-certificate.use-case';
import { FindPatientCertificateByIdUseCase } from '../application/use-cases/find-patient-certificate-by-id/find-patient-certificate-by-id.use-case';
import { ListPatientCertificatesUseCase } from '../application/use-cases/list-patient-certificates/list-patient-certificates.use-case';
import { InMemoryPatientCertificateRepository } from './in-memory-patient-certificate.repository';

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const PROFESSIONAL_A = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const CERTIFICATE_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

export type PatientCertificatesTestHarness = {
  patientRepo: InMemoryPatientRepository;
  certificateRepo: InMemoryPatientCertificateRepository;
  memberRepo: InMemoryMemberRepository;
  createPatientCertificate: CreatePatientCertificateUseCase;
  listPatientCertificates: ListPatientCertificatesUseCase;
  findPatientCertificateById: FindPatientCertificateByIdUseCase;
  deletePatientCertificate: DeletePatientCertificateUseCase;
};

export function createPatientCertificatesTestHarness(): PatientCertificatesTestHarness {
  const patientRepo = new InMemoryPatientRepository();
  const certificateRepo = new InMemoryPatientCertificateRepository();
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
  const resolveProfessionalCouncil = new ResolveProfessionalCouncilService(
    memberRepo,
    organizationRepo,
  );

  return {
    patientRepo,
    certificateRepo,
    memberRepo,
    createPatientCertificate: new CreatePatientCertificateUseCase(
      certificateRepo,
      patientRepo,
      assertPatientExists,
      resolveProfessionalCouncil,
    ),
    listPatientCertificates: new ListPatientCertificatesUseCase(
      certificateRepo,
      assertPatientExists,
    ),
    findPatientCertificateById: new FindPatientCertificateByIdUseCase(
      certificateRepo,
      assertPatientExists,
    ),
    deletePatientCertificate: new DeletePatientCertificateUseCase(
      certificateRepo,
      assertPatientExists,
    ),
  };
}

export function seedPatient(
  harness: PatientCertificatesTestHarness,
  patientId: string = PATIENT_A,
): void {
  seedMinimalPatient(harness.patientRepo, STORE_A, patientId, CATEGORY_A);
}

export async function seedProfessional(
  harness: PatientCertificatesTestHarness,
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

export const SAMPLE_CERTIFICATE_COUNCIL = {
  councilType: 'CRM' as const,
  councilNumber: '67890',
  councilUf: 'SP',
};
