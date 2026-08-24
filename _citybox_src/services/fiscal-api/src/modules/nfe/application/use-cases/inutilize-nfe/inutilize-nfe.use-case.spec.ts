import { randomUUID } from 'crypto';
import {
  buildIssueNfeTestContext,
  seedCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfe-test-context';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { CompanyNotFoundError } from '../../../../companies/domain/errors/company-not-found.error';
import { NfeInutilizationInvalidRangeError } from '../../../domain/errors/nfe-inutilization-invalid-range.error';
import { NfeInutilizationRangeOverlapError } from '../../../domain/errors/nfe-inutilization-range-overlap.error';

function buildAuthorizedNfeDocument(
  companyId: string,
  series: string,
  number: string,
) {
  const now = new Date();
  return FiscalDocument.with(
    {
      companyId,
      customerId: null,
      documentType: 'NFE',
      provider: 'SEFAZ_BA_NFE',
      environment: 'HOMOLOGATION',
      status: 'AUTHORIZED',
      sourceSystem: 'erp',
      externalReference: randomUUID(),
      idempotencyKey: randomUUID(),
      series,
      number,
      rpsSeries: null,
      rpsNumber: null,
      accessKey: '12345678901234567890123456789012345678901234',
      verificationCode: null,
      protocol: '129260000000001',
      totalAmount: 100,
      xmlObjectKey: null,
      errorCode: null,
      errorMessage: null,
      issuedAt: now,
      authorizedAt: now,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    },
    randomUUID(),
  );
}

/// US4 cenário 4 (FR-006): inutilização de faixa de numeração não utilizada.
describe('InutilizeNfeUseCase', () => {
  it('inutilizes a range with no overlapping authorized documents', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    const event = await ctx.inutilizeNfeUseCase.execute({
      companyId: company.id,
      series: '1',
      numberStart: 100,
      numberEnd: 110,
      justification: 'Faixa reservada e não utilizada no período',
    });

    expect(event.status).toBe('INUTILIZED');
    expect(event.eventType).toBe('INUTILIZATION');
    expect(event.fiscalDocumentId).toBeNull();
    expect(event.companyId).toBe(company.id);
    expect(event.series).toBe('1');
    expect(event.numberRangeStart).toBe(100n);
    expect(event.numberRangeEnd).toBe(110n);
  });

  it('throws NfeInutilizationInvalidRangeError when numberStart > numberEnd', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);

    await expect(
      ctx.inutilizeNfeUseCase.execute({
        companyId: company.id,
        series: '1',
        numberStart: 110,
        numberEnd: 100,
        justification: 'Faixa reservada e não utilizada no período',
      }),
    ).rejects.toBeInstanceOf(NfeInutilizationInvalidRangeError);
  });

  it('throws NfeInutilizationRangeOverlapError when the range contains an authorized number', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    await ctx.fiscalDocumentRepository.save(
      buildAuthorizedNfeDocument(company.id, '1', '105'),
    );

    await expect(
      ctx.inutilizeNfeUseCase.execute({
        companyId: company.id,
        series: '1',
        numberStart: 100,
        numberEnd: 110,
        justification: 'Faixa reservada e não utilizada no período',
      }),
    ).rejects.toBeInstanceOf(NfeInutilizationRangeOverlapError);
  });

  it('does not block on a document in the range that was never authorized', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const rejected = FiscalDocument.with(
      {
        ...buildAuthorizedNfeDocument(company.id, '1', '105').props,
        status: 'REJECTED',
        authorizedAt: null,
      },
      randomUUID(),
    );
    await ctx.fiscalDocumentRepository.save(rejected);

    const event = await ctx.inutilizeNfeUseCase.execute({
      companyId: company.id,
      series: '1',
      numberStart: 100,
      numberEnd: 110,
      justification: 'Faixa reservada e não utilizada no período',
    });

    expect(event.status).toBe('INUTILIZED');
  });

  it('records a provider-level rejection without throwing', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    ctx.fakeProvider.inutilizeResult = {
      status: 'REJECTED',
      errorMessage: 'Faixa já inutilizada anteriormente',
    };

    const event = await ctx.inutilizeNfeUseCase.execute({
      companyId: company.id,
      series: '1',
      numberStart: 100,
      numberEnd: 110,
      justification: 'Faixa reservada e não utilizada no período',
    });

    expect(event.status).toBe('REJECTED');
  });

  it('throws CompanyNotFoundError for an unknown company', async () => {
    const ctx = buildIssueNfeTestContext();

    await expect(
      ctx.inutilizeNfeUseCase.execute({
        companyId: '00000000-0000-4000-8000-000000000000',
        series: '1',
        numberStart: 100,
        numberEnd: 110,
        justification: 'Faixa reservada e não utilizada no período',
      }),
    ).rejects.toBeInstanceOf(CompanyNotFoundError);
  });
});
