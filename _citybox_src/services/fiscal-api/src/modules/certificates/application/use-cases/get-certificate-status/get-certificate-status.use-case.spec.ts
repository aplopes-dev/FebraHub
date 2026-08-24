import { randomUUID } from 'crypto';
import { InMemoryCertificateRepository } from '../../../tests/in-memory-certificate.repository';
import { GetCertificateStatusUseCase } from './get-certificate-status.use-case';
import { Certificate } from '../../../domain/entities/certificate.entity';
import { CertificateNotFoundError } from '../../../domain/errors/certificate-not-found.error';

/// US3 Acceptance Scenario 3 — sinaliza vencimento próximo.
describe('GetCertificateStatusUseCase', () => {
  it('reports daysUntilExpiration correctly for a certificate close to expiring', async () => {
    const repository = new InMemoryCertificateRepository();
    const validUntil = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // ~5 dias
    const certificate = Certificate.with(
      {
        companyId: randomUUID(),
        type: 'A1',
        name: null,
        encryptedPfxObjectKey: 'key',
        encryptedPassword: 'enc',
        subjectCnpj: '11222333000181',
        validFrom: new Date(Date.now() - 86400000),
        validUntil,
        status: 'VALID',
        createdAt: new Date(),
      },
      randomUUID(),
    );
    await repository.save(certificate);
    const useCase = new GetCertificateStatusUseCase(repository);

    const result = await useCase.execute({ certificateId: certificate.id });

    expect(result.status).toBe('VALID');
    expect(result.daysUntilExpiration).toBeGreaterThanOrEqual(4);
    expect(result.daysUntilExpiration).toBeLessThanOrEqual(5);
  });

  it('throws CertificateNotFoundError for an unknown certificate', async () => {
    const repository = new InMemoryCertificateRepository();
    const useCase = new GetCertificateStatusUseCase(repository);

    await expect(
      useCase.execute({ certificateId: randomUUID() }),
    ).rejects.toBeInstanceOf(CertificateNotFoundError);
  });
});
