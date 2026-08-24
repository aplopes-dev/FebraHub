import {
  baseIssueNfeDto,
  buildIssueNfeTestContext,
  seedCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfe-test-context';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';

/// SC-003 — XML autorizado disponível para download (o requisito de "em até
/// 5s" é sobre latência de infraestrutura real, não testável de forma
/// significativa com repositórios em memória; aqui cobrimos a
/// disponibilidade/corretude do conteúdo retornado).
describe('GetNfeXmlUseCase', () => {
  it('returns the authorized XML after a successful issuance', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    const result = await ctx.getNfeXmlUseCase.execute({
      fiscalDocumentId: issued.id,
    });

    expect(result.mimeType).toBe('application/xml');
    expect(result.buffer.toString('utf-8')).toContain('<NFe');
    expect(result.buffer.toString('utf-8')).toContain('<Signature');
  });

  it('throws FiscalDocumentNotFoundError when the document has no XML yet (e.g. rejected)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    ctx.fakeProvider.issueResult = { status: 'REJECTED', errorCode: 'E001' };
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    await expect(
      ctx.getNfeXmlUseCase.execute({ fiscalDocumentId: issued.id }),
    ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
  });
});
