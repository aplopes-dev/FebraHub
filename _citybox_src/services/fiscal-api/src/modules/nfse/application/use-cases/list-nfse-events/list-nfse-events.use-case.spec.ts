import {
  baseIssueNfseDto,
  buildIssueNfseTestContext,
  seedIlheusCompanyWithValidCertificate,
} from '../../../tests/fixtures/issue-nfse-test-context';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import type { RemoteFiscalEvent } from '../../../../providers/sefin-nacional/infrastructure/sefin-nacional-events-response';

/// US4/T033 — a linha do tempo é o que o contribuinte lê para entender o que
/// aconteceu com a nota dele.
describe('ListNfseEventsUseCase', () => {
  function stubRemoteEvents(
    ctx: ReturnType<typeof buildIssueNfseTestContext>,
    events: RemoteFiscalEvent[],
  ): void {
    jest.spyOn(ctx.sefinProvider, 'syncEvents').mockResolvedValue(events);
  }

  afterEach(() => jest.restoreAllMocks());

  it('throws for an unknown document', async () => {
    const ctx = buildIssueNfseTestContext();

    await expect(
      ctx.listNfseEventsUseCase.execute({
        fiscalDocumentId: '00000000-0000-4000-8000-000000000000',
      }),
    ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
  });

  it('marks events this API registered as LOCAL', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );
    await ctx.cancelNfseUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do serviço prestado original',
    });
    stubRemoteEvents(ctx, []);

    const timeline = await ctx.listNfseEventsUseCase.execute({
      fiscalDocumentId: issued.id,
    });

    expect(timeline).toHaveLength(1);
    expect(timeline[0].origin).toBe('LOCAL');
    expect(timeline[0].nationalEventCode).toBe('e101101');
  });

  /// O motivo de existir da sincronização: o município lança eventos de ofício
  /// que nunca passaram por esta API. Sem eles a linha do tempo mente por
  /// omissão exatamente quando o contribuinte mais precisa dela.
  it('includes municipality-issued events we never registered, marked REMOTE', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );
    stubRemoteEvents(ctx, [
      {
        nationalEventCode: 'e105104',
        generatorEnvironment: 1,
        protocol: 'evt-municipio-1',
        occurredAt: new Date('2026-08-06T12:00:00-03:00'),
        description: 'Cancelamento deferido por análise fiscal',
      },
    ]);

    const timeline = await ctx.listNfseEventsUseCase.execute({
      fiscalDocumentId: issued.id,
    });

    const remote = timeline.find((entry) => entry.origin === 'REMOTE');
    expect(remote?.nationalEventCode).toBe('e105104');
    expect(remote?.description).toContain('deferido');
  });

  /// Um evento que já registramos não pode aparecer duas vezes só porque o
  /// órgão também o reporta — a entrada LOCAL é a mais informativa e vence.
  it('does not duplicate an event that exists on both sides', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );
    await ctx.cancelNfseUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do serviço prestado original',
    });
    stubRemoteEvents(ctx, [
      {
        nationalEventCode: 'e101101',
        generatorEnvironment: 2,
        protocol: 'eco-do-mesmo-evento',
        occurredAt: new Date(),
        description: 'Cancelamento de NFS-e',
      },
    ]);

    const timeline = await ctx.listNfseEventsUseCase.execute({
      fiscalDocumentId: issued.id,
    });

    expect(
      timeline.filter((entry) => entry.nationalEventCode === 'e101101'),
    ).toHaveLength(1);
    expect(timeline[0].origin).toBe('LOCAL');
  });

  it('returns entries in chronological order', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );
    stubRemoteEvents(ctx, [
      {
        nationalEventCode: 'e105105',
        generatorEnvironment: 1,
        protocol: 'mais-novo',
        occurredAt: new Date('2026-09-01T10:00:00-03:00'),
        description: 'Indeferido',
      },
      {
        nationalEventCode: 'e105104',
        generatorEnvironment: 1,
        protocol: 'mais-antigo',
        occurredAt: new Date('2026-08-01T10:00:00-03:00'),
        description: 'Deferido',
      },
    ]);

    const timeline = await ctx.listNfseEventsUseCase.execute({
      fiscalDocumentId: issued.id,
    });

    const times = timeline.map((entry) => entry.occurredAt.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));
  });

  /// Órgão fora do ar não pode derrubar a consulta: `syncEvents` devolve lista
  /// vazia e a linha do tempo sai com o que já temos.
  it('still returns local events when the tax authority yields nothing', async () => {
    const ctx = buildIssueNfseTestContext();
    const { company } = await seedIlheusCompanyWithValidCertificate(ctx);
    const issued = await ctx.issueNfseUseCase.execute(
      baseIssueNfseDto(company.id),
    );
    await ctx.cancelNfseUseCase.execute({
      fiscalDocumentId: issued.id,
      justification: 'Erro no preenchimento do serviço prestado original',
    });
    stubRemoteEvents(ctx, []);

    const timeline = await ctx.listNfseEventsUseCase.execute({
      fiscalDocumentId: issued.id,
    });

    expect(timeline).toHaveLength(1);
  });
});
