import {
  baseIssueNfseDto,
  buildIssueNfseTestContext,
  seedIlheusCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfse-test-context';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { MunicipalParameters } from '../../../domain/entities/municipal-parameters.entity';
import { FiscalDocument } from '../../../../fiscal-documents/domain/entities/fiscal-document.entity';
import { NfseDocumentNotAuthorizedError } from '../../../domain/errors/nfse-document-not-authorized.error';

const DAYS_10_MS = 10 * 24 * 60 * 60 * 1000;

/// US4/T067 (FR-004 aplicado a NFS-e): cancelamento dentro/fora do prazo legal.
describe('CancelNfseUseCase', () => {
  it('cancels an authorized NFS-e within the legal deadline', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );
    expect(issued.status).toBe('AUTHORIZED');

    // O prazo precisa estar publicado para o caminho direto existir: sem
    // parametrizacao a regra manda para analise fiscal, que e o conservador.
    await ctx.municipalParametersRepository.save(
      MunicipalParameters.create({
        cityCodeIbge: company.cityCodeIbge,
        parameters: { prazoCancelamento: 30 },
        fetchedAt: new Date(),
      }),
    );

    const { document: cancelled } = await ctx.cancelNfseUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do serviço prestado original',
    });

    expect(cancelled.status).toBe('CANCEL_AUTHORIZED');
    expect(cancelled.cancelledAt).not.toBeNull();

    const events = await ctx.fiscalEventRepository.findByFiscalDocumentId(
      issued.id,
    );
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('CANCEL');
  });

  /// T026/FR-012 mudou esta regra: fora do prazo o pedido **não é mais
  /// recusado**. Recusar deixava o operador sem saída — a nota errada continuava
  /// válida e ele não tinha caminho nenhum. Agora vira solicitação de análise
  /// fiscal (`e101103`), que o município julga.
  it('routes to fiscal analysis instead of refusing when the deadline has passed', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    // Município publicou 5 dias; o documento tem 25 horas... e o prazo é lido
    // do cadastro, então precisa estar lá para o caminho direto existir.
    await ctx.municipalParametersRepository.save(
      MunicipalParameters.create({
        cityCodeIbge: company.cityCodeIbge,
        parameters: { prazoCancelamento: 5 },
        fetchedAt: new Date(),
      }),
    );

    const staleDocument = FiscalDocument.with(
      {
        ...issued.props,
        authorizedAt: new Date(Date.now() - DAYS_10_MS),
      },
      issued.id,
    ).withItems(issued.items);
    await ctx.fiscalDocumentRepository.save(staleDocument);

    const { document, path } = await ctx.cancelNfseUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do serviço prestado original',
    });

    expect(path).toBe('FISCAL_ANALYSIS');

    // A nota NÃO está cancelada: o pedido está em julgamento pelo município.
    // Marcá-la como cancelada aqui faria o lojista agir sobre uma nota que
    // segue valendo.
    expect(document.status).toBe('CANCEL_REQUESTED');
    expect(document.cancelledAt).toBeNull();

    const events = await ctx.fiscalEventRepository.findByFiscalDocumentId(
      issued.id,
    );
    const cancelEvent = events.find((e) => e.eventType === 'CANCEL');
    expect(cancelEvent?.nationalEventCode).toBe('e101103');
  });

  it('cancels directly while inside the deadline the municipality published', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );

    await ctx.municipalParametersRepository.save(
      MunicipalParameters.create({
        cityCodeIbge: company.cityCodeIbge,
        parameters: { prazoCancelamento: 30 },
        fetchedAt: new Date(),
      }),
    );

    const { document, path } = await ctx.cancelNfseUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do serviço prestado original',
    });

    expect(path).toBe('DIRECT');
    expect(document.status).toBe('CANCEL_AUTHORIZED');
    expect(document.cancelledAt).not.toBeNull();

    const events = await ctx.fiscalEventRepository.findByFiscalDocumentId(
      issued.id,
    );
    const cancelEvent = events.find((e) => e.eventType === 'CANCEL');
    expect(cancelEvent?.nationalEventCode).toBe('e101101');
  });

  it('throws NfseDocumentNotAuthorizedError for a document not AUTHORIZED', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );
    await ctx.cancelNfseUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do serviço prestado original',
    });

    await expect(
      ctx.cancelNfseUseCase.execute({
        fiscalDocumentId: issued.id,
        justification: 'Segunda tentativa de cancelamento do mesmo serviço',
      }),
    ).rejects.toBeInstanceOf(NfseDocumentNotAuthorizedError);
  });

  it('throws FiscalDocumentNotFoundError for an unknown document', async () => {
    const ctx = buildIssueNfseTestContext();

    await expect(
      ctx.cancelNfseUseCase.execute({
        fiscalDocumentId: '00000000-0000-4000-8000-000000000000',
        justification: 'Erro no preenchimento do serviço prestado original',
      }),
    ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
  });
});
