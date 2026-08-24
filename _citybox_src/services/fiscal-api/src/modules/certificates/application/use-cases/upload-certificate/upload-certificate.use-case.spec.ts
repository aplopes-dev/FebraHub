import { randomUUID } from 'crypto';
import {
  buildUploadCertificateTestContext,
  seedCompany,
} from '../../../tests/fixtures/upload-certificate-test-context';
import { buildSelfSignedCertificateFixture } from '../../../../../shared/infra/fiscal-signature/tests/fixtures/self-signed-certificate';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { CertificateCnpjMismatchError } from '../../../domain/errors/certificate-cnpj-mismatch.error';
import { InvalidCertificateFileError } from '../../../domain/errors/invalid-certificate-file.error';
import { Pkcs12ParseError } from '../../../../../shared/infra/fiscal-signature/errors/pkcs12-parse.error';

/// Cobre US3 Acceptance Scenario 1/2 + FR-007/FR-008/SC-006.
describe('UploadCertificateUseCase', () => {
  it('validates, encrypts, stores and persists a valid certificate matching the company CNPJ (Acceptance Scenario 1)', async () => {
    const ctx = buildUploadCertificateTestContext();
    const company = await seedCompany(ctx);
    const fixture = buildSelfSignedCertificateFixture({ cnpj: company.cnpj });

    const certificate = await ctx.uploadCertificateUseCase.execute({
      companyId: company.id,
      buffer: fixture.pfxBuffer,
      filename: 'certificado.pfx',
      password: fixture.password,
      name: 'Certificado Principal',
    });

    expect(certificate.status).toBe('VALID');
    expect(certificate.companyId).toBe(company.id);
    expect(certificate.subjectCnpj).toBe(company.cnpj);
    expect(certificate.name).toBe('Certificado Principal');

    const persisted = await ctx.certificateRepository.findById(certificate.id);
    expect(persisted).not.toBeNull();

    const stored = await ctx.objectStorage.get(
      certificate.encryptedPfxObjectKey,
    );
    expect(stored.buffer.length).toBeGreaterThan(0);
  });

  it('rejects (without persisting) when the certificate CNPJ does not match the company CNPJ (Acceptance Scenario 2)', async () => {
    const ctx = buildUploadCertificateTestContext();
    const company = await seedCompany(ctx, '11222333000181');
    const fixture = buildSelfSignedCertificateFixture({
      cnpj: '99888777000166', // CNPJ diferente do emitente
    });

    await expect(
      ctx.uploadCertificateUseCase.execute({
        companyId: company.id,
        buffer: fixture.pfxBuffer,
        filename: 'certificado.pfx',
        password: fixture.password,
      }),
    ).rejects.toBeInstanceOf(CertificateCnpjMismatchError);

    const all = await ctx.certificateRepository.findAllByCompanyId(company.id);
    expect(all).toHaveLength(0);
  });

  it('rejects (without persisting) an incorrect password (Acceptance Scenario 2, SC-006)', async () => {
    const ctx = buildUploadCertificateTestContext();
    const company = await seedCompany(ctx);
    const fixture = buildSelfSignedCertificateFixture({ cnpj: company.cnpj });

    await expect(
      ctx.uploadCertificateUseCase.execute({
        companyId: company.id,
        buffer: fixture.pfxBuffer,
        filename: 'certificado.pfx',
        password: 'senha-errada',
      }),
    ).rejects.toBeInstanceOf(Pkcs12ParseError);

    const all = await ctx.certificateRepository.findAllByCompanyId(company.id);
    expect(all).toHaveLength(0);
  });

  it('rejects (without persisting) a file that is not a valid PKCS#12 container', async () => {
    const ctx = buildUploadCertificateTestContext();
    const company = await seedCompany(ctx);

    await expect(
      ctx.uploadCertificateUseCase.execute({
        companyId: company.id,
        buffer: Buffer.from('not a certificate at all'),
        filename: 'certificado.pfx',
        password: 'whatever',
      }),
    ).rejects.toBeInstanceOf(InvalidCertificateFileError);

    const all = await ctx.certificateRepository.findAllByCompanyId(company.id);
    expect(all).toHaveLength(0);
  });

  it('throws CompanyNotFoundError for an unknown company', async () => {
    const ctx = buildUploadCertificateTestContext();
    const fixture = buildSelfSignedCertificateFixture();

    await expect(
      ctx.uploadCertificateUseCase.execute({
        companyId: randomUUID(),
        buffer: fixture.pfxBuffer,
        filename: 'certificado.pfx',
        password: fixture.password,
      }),
    ).rejects.toBeInstanceOf(CompanyNotFoundError);
  });
});
