import {
  baseIssueNfeDto,
  buildIssueNfeTestContext,
  seedCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfe-test-context';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { NfeCancelDeadlineConflictError } from '../../../domain/errors/nfe-cancel-deadline-expired.error';
import { NfeDocumentNotAuthorizedError } from '../../../domain/errors/nfe-document-not-authorized.error';

const HOURS_25_MS = 25 * 60 * 60 * 1000;

/// US4 cenário 1 e 2 (FR-004): cancelamento dentro/fora do prazo legal.
describe('CancelNfeUseCase', () => {
  it('cancels an authorized NF-e within the legal deadline', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );
    expect(issued.status).toBe('AUTHORIZED');

    const cancelled = await ctx.cancelNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do pedido original',
    });

    expect(cancelled.status).toBe('CANCEL_AUTHORIZED');
    expect(cancelled.cancelledAt).not.toBeNull();

    const events = await ctx.fiscalEventRepository.findByFiscalDocumentId(
      issued.id,
    );
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('CANCEL');
    expect(events[0].justification).toBe(
      'Erro no preenchimento do pedido original',
    );
  });

  it('rejects cancellation outside the legal deadline', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    // Simula um documento autorizado há mais de 24h.
    const staleDocument = FiscalDocument.with(
      {
        ...issued.props,
        authorizedAt: new Date(Date.now() - HOURS_25_MS),
      },
      issued.id,
    ).withItems(issued.items);
    await ctx.fiscalDocumentRepository.save(staleDocument);

    await expect(
      ctx.cancelNfeUseCase.execute({
        fiscalDocumentId: issued.id,
        justification: 'Erro no preenchimento do pedido original',
      }),
    ).rejects.toBeInstanceOf(NfeCancelDeadlineConflictError);
  });

  it('records a provider-level rejection without throwing', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );
    ctx.fakeProvider.cancelResult = {
      status: 'CANCEL_REJECTED',
      errorMessage: 'Protocolo de autorização não localizado',
    };

    const cancelled = await ctx.cancelNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do pedido original',
    });

    // A recusa fica na trilha, mas o documento continua AUTHORIZED — ver o
    // teste de nova tentativa abaixo.
    expect(cancelled.status).toBe('AUTHORIZED');
    expect(cancelled.cancelledAt).toBeNull();

    const requests = await ctx.providerRequestRepository.findByFiscalDocumentId(
      issued.id,
    );
    expect(requests.find((r) => r.operation === 'CANCEL')?.status).toBe(
      'ERROR',
    );
  });

  it('throws NfeDocumentNotAuthorizedError for a document not AUTHORIZED', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );
    await ctx.cancelNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do pedido original',
    });

    // Já cancelado — uma segunda tentativa não encontra mais AUTHORIZED.
    await expect(
      ctx.cancelNfeUseCase.execute({
        fiscalDocumentId: issued.id,
        justification: 'Segunda tentativa de cancelamento',
      }),
    ).rejects.toBeInstanceOf(NfeDocumentNotAuthorizedError);
  });

  it('throws FiscalDocumentNotFoundError for an unknown document', async () => {
    const ctx = buildIssueNfeTestContext();

    await expect(
      ctx.cancelNfeUseCase.execute({
        fiscalDocumentId: '00000000-0000-4000-8000-000000000000',
        justification: 'Erro no preenchimento do pedido original',
      }),
    ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
  });

  /// FR-011 exige registrar "o que foi enviado e o que foi recebido". O
  /// cancelamento é o evento que mais precisa disso — é ele que o fisco
  /// questiona depois — e era exatamente onde a trilha guardava só o desfecho.
  it('archives the raw cancel envelopes and links them from the audit trail', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    ctx.fakeProvider.cancelResult = {
      status: 'CANCEL_AUTHORIZED',
      protocol: 'proto-cancel-1',
      rawRequestXml: '<envEvento>cancelamento enviado</envEvento>',
      rawResponseXml: '<retEnvEvento>cancelamento aceito</retEnvEvento>',
    };

    await ctx.cancelNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do pedido original',
    });

    const requests = await ctx.providerRequestRepository.findByFiscalDocumentId(
      issued.id,
    );
    const cancelRequest = requests.find((r) => r.operation === 'CANCEL');
    expect(cancelRequest).toBeDefined();
    expect(cancelRequest?.requestXmlObjectKey).not.toBeNull();
    expect(cancelRequest?.responseXmlObjectKey).not.toBeNull();

    // O evento aponta para os mesmos objetos: é por ele que a consulta de
    // auditoria chega no XML, e uma divergência aqui deixaria o rastro quebrado.
    const events = await ctx.fiscalEventRepository.findByFiscalDocumentId(
      issued.id,
    );
    const cancelEvent = events.find((e) => e.eventType === 'CANCEL');
    expect(cancelEvent?.requestXmlObjectKey).toBe(
      cancelRequest?.requestXmlObjectKey,
    );
    expect(cancelEvent?.responseXmlObjectKey).toBe(
      cancelRequest?.responseXmlObjectKey,
    );

    // Chave gravada mas objeto ausente seria pior que null: aparenta trilha
    // completa e falha só na hora da fiscalização.
    const stored = await ctx.objectStorage.get(
      cancelRequest?.requestXmlObjectKey ?? '',
    );
    expect(stored.buffer.toString('utf-8')).toContain('cancelamento enviado');
  });

  /// Cancelamento rejeitado NAO cancela a nota — ela segue autorizada no órgão
  /// fiscal. Marcá-la `CANCEL_REJECTED` a torna inelegível para nova tentativa
  /// (o guard exige `AUTHORIZED`), transformando uma recusa **transitória** —
  /// "Chave de acesso inexistente" por atraso de propagação, verificado contra
  /// a SEFAZ-BA em 2026-08-07 — em beco sem saída permanente.
  ///
  /// A tentativa fica registrada no `FiscalEvent` e no `ProviderRequest`; o
  /// documento reflete a verdade: continua autorizado.
  it('keeps the document AUTHORIZED when the cancellation is refused, allowing a retry', async () => {
    const ctx = buildIssueNfeTestContext();
    const { company } = await seedCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfeUseCase.execute(
      baseIssueNfeDto(company.id),
    );

    ctx.fakeProvider.cancelResult = {
      status: 'CANCEL_REJECTED',
      errorMessage: 'Rejeicao: Chave de acesso inexistente',
    };
    const recusado = await ctx.cancelNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Primeira tentativa, recusada por propagacao',
    });

    expect(recusado.status).toBe('AUTHORIZED');
    expect(recusado.cancelledAt).toBeNull();

    // E a segunda tentativa passa pelo guard, em vez de bater em
    // NfeDocumentNotAuthorizedError.
    ctx.fakeProvider.cancelResult = { status: 'CANCEL_AUTHORIZED' };
    const aceito = await ctx.cancelNfeUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Segunda tentativa, apos a propagacao concluir',
    });

    expect(aceito.status).toBe('CANCEL_AUTHORIZED');
  });
});
