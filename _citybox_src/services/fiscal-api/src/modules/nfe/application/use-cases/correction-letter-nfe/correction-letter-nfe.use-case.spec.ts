import {
  baseIssueNfeDto,
  buildIssueNfeTestContext,
  seedCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfe-test-context';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { NfeDocumentNotAuthorizedError } from '../../../domain/errors/nfe-document-not-authorized.error';
import { NfeCorrectionFieldNotAllowedError } from '../../../domain/errors/nfe-correction-field-not-allowed.error';

/// US4 cenário 3 (FR-005): carta de correção para NF-e autorizada.
describe('CorrectionLetterNfeUseCase', () => {
  it('issues a correction letter for an authorized NF-e (sequence 1)', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    const event = await ctx.correctionLetterNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      correctionText:
        'Corrige o número do pedido de compra informado na descrição do item',
    });

    expect(event.status).toBe('CORRECTION_LETTER_AUTHORIZED');
    expect(event.sequence).toBe(1);
    expect(event.eventType).toBe('CORRECTION_LETTER');
    expect(event.protocol).toBe('fake-cce-protocol-123');
    expect(ctx.fakeProvider.lastCorrectionLetterInput?.sequence).toBe(1);
  });

  it('increments sequence on a second correction letter for the same document', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    await ctx.correctionLetterNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      correctionText: 'Primeira correção do pedido de compra informado',
    });
    const second = await ctx.correctionLetterNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      correctionText: 'Segunda correção do pedido de compra informado',
    });

    expect(second.sequence).toBe(2);
  });

  it('rejects correction text mentioning a non-correctable field', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    await expect(
      ctx.correctionLetterNfeUseCase.execute({
        fiscalDocumentId: issued.id,
        correctionText: 'Corrige o valor total informado no item vendido',
      }),
    ).rejects.toBeInstanceOf(NfeCorrectionFieldNotAllowedError);
  });

  it('records a provider-level rejection without throwing', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );
    ctx.fakeProvider.correctionLetterResult = {
      status: 'REJECTED',
      errorMessage: 'Chave de acesso não localizada',
    };

    const event = await ctx.correctionLetterNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      correctionText: 'Corrige o número do pedido de compra informado',
    });

    expect(event.status).toBe('REJECTED');
  });

  it('throws NfeDocumentNotAuthorizedError for a document not AUTHORIZED', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    ctx.fakeProvider.issueResult = { status: 'REJECTED', errorCode: '999' };
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );
    expect(issued.status).toBe('REJECTED');

    await expect(
      ctx.correctionLetterNfeUseCase.execute({
        fiscalDocumentId: issued.id,
        correctionText: 'Corrige o número do pedido de compra informado',
      }),
    ).rejects.toBeInstanceOf(NfeDocumentNotAuthorizedError);
  });

  it('throws FiscalDocumentNotFoundError for an unknown document', async () => {
    const ctx = buildIssueNfeTestContext();

    await expect(
      ctx.correctionLetterNfeUseCase.execute({
        fiscalDocumentId: '00000000-0000-4000-8000-000000000000',
        correctionText: 'Corrige o número do pedido de compra informado',
      }),
    ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
  });
});
