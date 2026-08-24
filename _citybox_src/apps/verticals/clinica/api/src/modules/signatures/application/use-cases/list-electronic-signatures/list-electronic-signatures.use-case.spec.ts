import { ListElectronicSignaturesUseCase } from './list-electronic-signatures.use-case';
import { ElectronicSignature } from '../../../domain/entities/electronic-signature.entity';
import { InMemoryElectronicSignatureRepository } from '../../../tests/in-memory-electronic-signature.repository';

const STORE = '11111111-1111-4111-8111-111111111111';
const PATIENT = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function makeSignature(overrides: {
  status?: 'pending' | 'signed' | 'cancelled';
  kind?: 'anamnesis' | 'contract' | 'evolution_batch';
  requestedAt: Date;
  zapsignDocumentToken: string;
}): ElectronicSignature {
  return ElectronicSignature.create({
    storeId: STORE,
    patientId: PATIENT,
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
        signedAt: overrides.status === 'signed' ? overrides.requestedAt.toISOString() : null,
      },
    ],
    requestedById: 'member-1',
    requestedByName: 'Dr. Silva',
    requestedAt: overrides.requestedAt,
  });
}

describe('ListElectronicSignaturesUseCase', () => {
  let useCase: ListElectronicSignaturesUseCase;
  let repo: InMemoryElectronicSignatureRepository;

  beforeEach(() => {
    repo = new InMemoryElectronicSignatureRepository();
    repo.setPatientName(PATIENT, 'Ana Paciente');
    useCase = new ListElectronicSignaturesUseCase(repo);
  });

  it('should list signatures in period with patient name and stats', async () => {
    await repo.save(
      makeSignature({
        status: 'pending',
        requestedAt: new Date('2026-08-05T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-pending',
      }),
    );
    await repo.save(
      makeSignature({
        status: 'signed',
        requestedAt: new Date('2026-08-06T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-signed',
      }),
    );
    await repo.save(
      makeSignature({
        status: 'cancelled',
        requestedAt: new Date('2026-08-07T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-cancelled',
      }),
    );
    await repo.save(
      makeSignature({
        status: 'signed',
        requestedAt: new Date('2026-07-01T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-old',
      }),
    );

    const result = await useCase.execute({
      storeId: STORE,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
    });

    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].patientName).toBe('Ana Paciente');
    expect(result.items[0].signature.status).toBe('signed');
    expect(result.stats).toEqual({
      enviados: 3,
      pendentes: 1,
      assinados: 1,
    });
  });

  it('should filter by kind and status', async () => {
    await repo.save(
      makeSignature({
        kind: 'contract',
        status: 'signed',
        requestedAt: new Date('2026-08-05T12:00:00.000Z'),
        zapsignDocumentToken: 'tok-contract',
      }),
    );
    await repo.save(
      makeSignature({
        kind: 'anamnesis',
        status: 'signed',
        requestedAt: new Date('2026-08-05T13:00:00.000Z'),
        zapsignDocumentToken: 'tok-anamnesis',
      }),
    );

    const result = await useCase.execute({
      storeId: STORE,
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      kind: 'anamnesis',
      statuses: ['signed'],
    });

    expect(result.total).toBe(1);
    expect(result.items[0].signature.kind).toBe('anamnesis');
    expect(result.stats.enviados).toBe(1);
  });

  it('should reject invalid date range', async () => {
    await expect(
      useCase.execute({
        storeId: STORE,
        startDate: '2026-08-31',
        endDate: '2026-08-01',
      }),
    ).rejects.toMatchObject({
      externalMessage: 'A data final deve ser maior ou igual à data inicial.',
    });
  });
});
