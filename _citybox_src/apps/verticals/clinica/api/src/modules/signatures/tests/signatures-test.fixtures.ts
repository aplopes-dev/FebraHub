import { InMemoryObjectStorage } from '../../../shared/infra/storage/in-memory-object-storage';
import { Patient } from '../../patients/domain/entities/patient.entity';
import { PatientAnamnesis } from '../../patients/patient-anamneses/domain/entities/patient-anamnesis.entity';
import { InMemoryPatientAnamnesisRepository } from '../../patients/patient-anamneses/tests/in-memory-patient-anamnesis.repository';
import { PatientContractEmission } from '../../patients/patient-contract-emissions/domain/entities/patient-contract-emission.entity';
import { InMemoryPatientContractEmissionRepository } from '../../patients/patient-contract-emissions/tests/in-memory-patient-contract-emission.repository';
import { InMemoryPatientRepository } from '../../patients/tests/in-memory-patient.repository';
import {
  CATEGORY_A,
  STORE_A,
} from '../../patients/tests/patients-test.fixtures';
import { InMemoryTreatmentEvolutionRepository } from '../../patients/treatment-evolutions/tests/in-memory-treatment-evolution.repository';
import { ConsumeSignatureCreditService } from '../../signature-packages/application/services/consume-signature-credit.service';
import { SignatureCreditBalance } from '../../signature-packages/domain/entities/signature-credit-balance.entity';
import { InMemorySignatureCreditBalanceRepository } from '../../signature-packages/tests/in-memory-signature-credit-balance.repository';
import { RequestAnamnesisSignatureUseCase } from '../application/use-cases/request-anamnesis-signature/request-anamnesis-signature.use-case';
import { RequestContractSignatureUseCase } from '../application/use-cases/request-contract-signature/request-contract-signature.use-case';
import { RequestEvolutionBatchSignatureUseCase } from '../application/use-cases/request-evolution-batch-signature/request-evolution-batch-signature.use-case';
import { CancelElectronicSignatureUseCase } from '../application/use-cases/cancel-electronic-signature/cancel-electronic-signature.use-case';
import { HandleZapSignWebhookUseCase } from '../application/use-cases/handle-zapsign-webhook/handle-zapsign-webhook.use-case';
import { FakeZapSignClient, SAMPLE_PDF_BASE64 } from './fake-zapsign.client';
import { InMemoryElectronicSignatureRepository } from './in-memory-electronic-signature.repository';

export { SAMPLE_PDF_BASE64, STORE_A };

export const PATIENT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const ANAMNESIS_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const CONTRACT_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
export const EVOLUTION_A = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
export const EVOLUTION_B = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

export type SignaturesTestHarness = {
  signatureRepo: InMemoryElectronicSignatureRepository;
  anamnesisRepo: InMemoryPatientAnamnesisRepository;
  contractRepo: InMemoryPatientContractEmissionRepository;
  evolutionRepo: InMemoryTreatmentEvolutionRepository;
  patientRepo: InMemoryPatientRepository;
  creditBalanceRepo: InMemorySignatureCreditBalanceRepository;
  zapSign: FakeZapSignClient;
  storage: InMemoryObjectStorage;
  requestAnamnesisSignature: RequestAnamnesisSignatureUseCase;
  requestContractSignature: RequestContractSignatureUseCase;
  requestEvolutionBatchSignature: RequestEvolutionBatchSignatureUseCase;
  cancelElectronicSignature: CancelElectronicSignatureUseCase;
  handleZapSignWebhook: HandleZapSignWebhookUseCase;
};

export function createSignaturesTestHarness(
  options: { initialCredits?: number } = {},
): SignaturesTestHarness {
  const signatureRepo = new InMemoryElectronicSignatureRepository();
  const anamnesisRepo = new InMemoryPatientAnamnesisRepository();
  const contractRepo = new InMemoryPatientContractEmissionRepository();
  const evolutionRepo = new InMemoryTreatmentEvolutionRepository();
  const patientRepo = new InMemoryPatientRepository();
  const creditBalanceRepo = new InMemorySignatureCreditBalanceRepository();
  const zapSign = new FakeZapSignClient();
  const storage = new InMemoryObjectStorage();
  const consumeSignatureCredit = new ConsumeSignatureCreditService(
    creditBalanceRepo,
  );

  const initialCredits = options.initialCredits ?? 10;
  void creditBalanceRepo.save(
    SignatureCreditBalance.create({
      storeId: STORE_A,
      balance: initialCredits,
    }),
  );

  return {
    signatureRepo,
    anamnesisRepo,
    contractRepo,
    evolutionRepo,
    patientRepo,
    creditBalanceRepo,
    zapSign,
    storage,
    requestAnamnesisSignature: new RequestAnamnesisSignatureUseCase(
      signatureRepo,
      anamnesisRepo,
      patientRepo,
      zapSign,
      storage,
      consumeSignatureCredit,
    ),
    requestContractSignature: new RequestContractSignatureUseCase(
      signatureRepo,
      contractRepo,
      patientRepo,
      zapSign,
      storage,
      consumeSignatureCredit,
    ),
    requestEvolutionBatchSignature: new RequestEvolutionBatchSignatureUseCase(
      signatureRepo,
      evolutionRepo,
      patientRepo,
      zapSign,
      storage,
      consumeSignatureCredit,
    ),
    cancelElectronicSignature: new CancelElectronicSignatureUseCase(
      signatureRepo,
      anamnesisRepo,
      contractRepo,
      evolutionRepo,
      zapSign,
    ),
    handleZapSignWebhook: new HandleZapSignWebhookUseCase(
      signatureRepo,
      anamnesisRepo,
      contractRepo,
      evolutionRepo,
      zapSign,
      storage,
    ),
  };
}

export function seedPatientWithPhone(
  harness: SignaturesTestHarness,
  overrides: {
    birthDate?: Date | null;
    guardianName?: string;
    guardianPhone?: string;
    phone?: string;
    email?: string;
  } = {},
): void {
  const patient = Patient.create(
    {
      storeId: STORE_A,
      status: 'active',
      name: 'Maria Silva',
      cpf: null,
      rg: '',
      birthDate: overrides.birthDate ?? new Date('1990-01-15'),
      gender: 'female',
      photoObjectKey: null,
      photoMimeType: null,
      phone: overrides.phone ?? '73999887766',
      landlinePhone: '',
      email: overrides.email ?? 'maria@example.com',
      socialNetwork: '',
      medicalRecordNumber: '',
      referralOriginId: null,
      referredByPatientId: null,
      referredByMemberId: null,
      referredByMemberName: null,
      referredByExternalProfessionalId: null,
      profession: '',
      categoryId: CATEGORY_A,
      guardianName: overrides.guardianName ?? '',
      guardianBirthDate: null,
      guardianCpf: null,
      guardianPhone: overrides.guardianPhone ?? '',
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
    PATIENT_A,
  );
  void harness.patientRepo.save(patient);
  harness.patientRepo.seedCategory(CATEGORY_A, {
    name: 'Particular',
    colorId: '#3b82f6',
  });
}

export function seedIssuedAnamnesis(
  harness: SignaturesTestHarness,
): PatientAnamnesis {
  const anamnesis = PatientAnamnesis.create(
    {
      storeId: STORE_A,
      patientId: PATIENT_A,
      templateId: 'tmpl-1',
      templateName: 'Anamnese Geral',
      issuedAt: new Date('2026-07-01'),
      status: 'issued',
      signatureStatus: 'unsigned',
      fillingMode: 'professional',
      consultationReason: 'Dor',
      questionsSnapshot: [],
      answers: [],
      publicToken: null,
      linkExpiresAt: null,
    },
    ANAMNESIS_A,
  );
  void harness.anamnesisRepo.save(anamnesis);
  return anamnesis;
}

export function seedUnsignedContract(
  harness: SignaturesTestHarness,
): PatientContractEmission {
  const contract = PatientContractEmission.create(
    {
      storeId: STORE_A,
      patientId: PATIENT_A,
      templateId: 'tmpl-contract',
      templateName: 'Contrato Padrão',
      content: '<p>Contrato</p>',
      issuedAt: new Date('2026-07-01'),
      issuedVia: 'manual',
      responsibleName: 'Dr. Carlos',
      patientName: 'Maria Silva',
      responsibleSignatureStatus: 'unsigned',
      patientSignatureStatus: 'unsigned',
      formValues: {
        templateId: 'tmpl-contract',
        contractorName: 'Maria Silva',
        contractorBirthDate: '',
        contractorCpf: '',
        contractorZip: '',
        contractorStreet: '',
        contractorNeighborhood: '',
        contractorCity: '',
        contractorState: '',
        contractedName: 'Dr. Carlos',
        contractedDocument: '',
        contractedCity: '',
        contractValue: '',
        treatmentsDescription: '',
        contractDate: '',
      },
    },
    CONTRACT_A,
  );
  void harness.contractRepo.save(contract);
  return contract;
}

export function seedUnsignedEvolutions(harness: SignaturesTestHarness): void {
  harness.evolutionRepo.seedEvolution(
    {
      storeId: STORE_A,
      patientId: PATIENT_A,
      source: 'standalone',
      finalizedAt: new Date('2026-07-01'),
      description: 'Evolução A',
      evolutionNotes: 'Nota A',
      professionalName: 'Dr. Ana',
    },
    EVOLUTION_A,
  );
  harness.evolutionRepo.seedEvolution(
    {
      storeId: STORE_A,
      patientId: PATIENT_A,
      source: 'standalone',
      finalizedAt: new Date('2026-07-02'),
      description: 'Evolução B',
      evolutionNotes: 'Nota B',
      professionalName: 'Dr. Ana',
    },
    EVOLUTION_B,
  );
}
