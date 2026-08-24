import { randomUUID } from 'crypto';
import { InMemoryCertificateRepository } from '../../../tests/in-memory-certificate.repository';
import { ActivateCertificateUseCase } from './activate-certificate.use-case';
import { Certificate } from '../../../domain/entities/certificate.entity';
import { CertificateNotFoundError } from '../../../domain/errors/certificate-not-found.error';
import { CertificateNotValidForActivationConflictError } from '../../../domain/errors/certificate-not-valid-for-activation.error';

function buildCertificate(status: Certificate['status']): Certificate {
  return Certificate.with(
    {
      companyId: randomUUID(),
      type: 'A1',
      name: null,
      encryptedPfxObjectKey: 'key',
      encryptedPassword: 'enc',
      subjectCnpj: '11222333000181',
      validFrom: new Date(Date.now() - 86400000),
      validUntil: new Date(Date.now() + 86400000),
      status,
      createdAt: new Date(),
    },
    randomUUID(),
  );
}

describe('ActivateCertificateUseCase', () => {
  it('returns the certificate when it is already VALID', async () => {
    const repository = new InMemoryCertificateRepository();
    const certificate = buildCertificate('VALID');
    await repository.save(certificate);
    const useCase = new ActivateCertificateUseCase(repository);

    const result = await useCase.execute({ certificateId: certificate.id });

    expect(result.id).toBe(certificate.id);
    expect(result.status).toBe('VALID');
  });

  it('throws a 409-mapped conflict error when the target certificate is not VALID', async () => {
    const repository = new InMemoryCertificateRepository();
    const certificate = buildCertificate('EXPIRED');
    await repository.save(certificate);
    const useCase = new ActivateCertificateUseCase(repository);

    await expect(
      useCase.execute({ certificateId: certificate.id }),
    ).rejects.toBeInstanceOf(CertificateNotValidForActivationConflictError);
  });

  it('throws CertificateNotFoundError for an unknown certificate', async () => {
    const repository = new InMemoryCertificateRepository();
    const useCase = new ActivateCertificateUseCase(repository);

    await expect(
      useCase.execute({ certificateId: randomUUID() }),
    ).rejects.toBeInstanceOf(CertificateNotFoundError);
  });
});
