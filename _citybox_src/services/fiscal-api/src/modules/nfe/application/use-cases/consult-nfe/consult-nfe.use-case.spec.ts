import {
  baseIssueNfeDto,
  buildIssueNfeTestContext,
  seedCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfe-test-context';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';

/// Acceptance Scenario 3 de US1: consultar status/protocolo/XML de um
/// documento já autorizado.
describe('ConsultNfeUseCase', () => {
  it('returns the persisted status without calling the provider again when not SYNC_REQUIRED', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );
    expect(ctx.fakeProvider.issueCallCount).toBe(1);

    const consulted = await ctx.consultNfeUseCase.execute({
      fiscalDocumentId: issued.id,
    });

    expect(consulted.id).toBe(issued.id);
    expect(consulted.status).toBe('AUTHORIZED');
    expect(consulted.protocol).toBe('fake-protocol-123');
  });

  it('re-consults the provider and updates status when the document is SYNC_REQUIRED', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    ctx.fakeProvider.issueResult = { status: 'SYNC_REQUIRED' };
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );
    expect(issued.status).toBe('SYNC_REQUIRED');

    ctx.fakeProvider.consultResult = {
      status: 'AUTHORIZED',
      protocol: 'late-protocol-456',
    };

    const consulted = await ctx.consultNfeUseCase.execute({
      fiscalDocumentId: issued.id,
    });

    expect(consulted.status).toBe('AUTHORIZED');
    expect(consulted.protocol).toBe('late-protocol-456');
  });

  it('throws FiscalDocumentNotFoundError for an unknown document', async () => {
    const ctx = buildIssueNfeTestContext();

    await expect(
      ctx.consultNfeUseCase.execute({
        fiscalDocumentId: '00000000-0000-4000-8000-000000000000',
      }),
    ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
  });
});
