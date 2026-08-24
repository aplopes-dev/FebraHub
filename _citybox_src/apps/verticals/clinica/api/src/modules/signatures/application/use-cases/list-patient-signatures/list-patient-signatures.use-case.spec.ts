import { ListPatientSignaturesUseCase } from './list-patient-signatures.use-case';
import { ElectronicSignature } from '../../../domain/entities/electronic-signature.entity';
import { PatientNotFoundError } from '../../../../patients/domain/errors/patient-not-found.error';
import {
  PATIENT_A,
  STORE_A,
  createSignaturesTestHarness,
  seedPatientWithPhone,
} from '../../../tests/signatures-test.fixtures';

const OTHER_STORE = '22222222-2222-4222-8222-222222222222';
const OTHER_PATIENT = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

function makeSignature(overrides: {
  storeId?: string;
  patientId?: string;
  status?: 'pending' | 'signed' | 'cancelled';
  kind?: 'anamnesis' | 'contract' | 'evolution_batch';
  requestedAt: Date;
  zapsignDocumentToken: string;
}): ElectronicSignature {
  return ElectronicSignature.create({
    storeId: overrides.storeId ?? STORE_A,
    patientId: overrides.patientId ?? PATIENT_A,
    kind: overrides.kind ?? 'anamnesis',
    targetId: 'target-1',
    zapsignDocumentToken: overrides.zapsignDocumentToken,
    status: overrides.status ?? 'pending',
    originalPdfObjectKey: 'pdfs/original.pdf',
    signers: [
      {
        role: 'patient',
        name: 'Ana',
        email: 'ana@example.com',
        phone: '73999999999',
        zapsignSignerToken: 'signer-1',
        signUrl: 'https://zapsign.example/s/1',
        status: overrides.status === 'signed' ? 'signed' : 'pending',
        signedAt:
          overrides.status === 'signed'
            ? overrides.requestedAt.toISOString()
            : null,
      },
    ],
    requestedById: 'member-1',
    requestedByName: 'Dr. Silva',
    requestedAt: overrides.requestedAt,
  });
}

describe('ListPatientSignaturesUseCase', () => {
  let useCase: ListPatientSignaturesUseCase;
  let harness: ReturnType<typeof createSignaturesTestHarness>;

  beforeEach(() => {
    harness = createSignaturesTestHarness();
    seedPatientWithPhone(harness);
    useCase = new ListPatientSignaturesUseCase(
      harness.signatureRepo,
      harness.patientRepo,
    );
  });

  it('lists only pending signatures for the patient by default', async () => {
    await harness.signatureRepo.save(
      makeSignature({
        status: 'pending',
        kind: 'contract',
        requestedAt: new Date('2026-08-05T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-pending-contract',
      }),
    );
    await harness.signatureRepo.save(
      makeSignature({
        status: 'pending',
        kind: 'anamnesis',
        requestedAt: new Date('2026-08-06T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-pending-anamnesis',
      }),
    );
    await harness.signatureRepo.save(
      makeSignature({
        status: 'signed',
        requestedAt: new Date('2026-08-07T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-signed',
      }),
    );
    await harness.signatureRepo.save(
      makeSignature({
        status: 'cancelled',
        requestedAt: new Date('2026-08-08T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-cancelled',
      }),
    );

    const result = await useCase.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
    });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items.map((s) => s.zapsignDocumentToken)).toEqual([
      'tok-pending-anamnesis',
      'tok-pending-contract',
    ]);
    expect(result.items.every((s) => s.status === 'pending')).toBe(true);
  });

  it('orders by requestedAt desc and paginates', async () => {
    for (let day = 1; day <= 3; day += 1) {
      await harness.signatureRepo.save(
        makeSignature({
          requestedAt: new Date(`2026-08-0${day}T12:00:00.000Z`),
          zapsignDocumentToken: `tok-day-${day}`,
        }),
      );
    }

    const page1 = await useCase.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 1,
      perPage: 2,
    });

    expect(page1.total).toBe(3);
    expect(page1.totalPages).toBe(2);
    expect(page1.items.map((s) => s.zapsignDocumentToken)).toEqual([
      'tok-day-3',
      'tok-day-2',
    ]);

    const page2 = await useCase.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
      page: 2,
      perPage: 2,
    });

    expect(page2.items.map((s) => s.zapsignDocumentToken)).toEqual([
      'tok-day-1',
    ]);
  });

  it('isolates by store and patient', async () => {
    await harness.signatureRepo.save(
      makeSignature({
        requestedAt: new Date('2026-08-05T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-self',
      }),
    );
    await harness.signatureRepo.save(
      makeSignature({
        patientId: OTHER_PATIENT,
        requestedAt: new Date('2026-08-05T13:00:00.000Z'),
        zapsignDocumentToken: 'tok-other-patient',
      }),
    );
    await harness.signatureRepo.save(
      makeSignature({
        storeId: OTHER_STORE,
        requestedAt: new Date('2026-08-05T14:00:00.000Z'),
        zapsignDocumentToken: 'tok-other-store',
      }),
    );

    const result = await useCase.execute({
      storeId: STORE_A,
      patientId: PATIENT_A,
    });

    expect(result.total).toBe(1);
    expect(result.items[0]?.zapsignDocumentToken).toBe('tok-self');
  });

  it('throws when patient does not exist', async () => {
    await expect(
      useCase.execute({
        storeId: STORE_A,
        patientId: OTHER_PATIENT,
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundError);
  });
});
