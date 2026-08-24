import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaFiscalEventRepository } from '../../src/modules/fiscal-documents/infrastructure/database/prisma-fiscal-event.repository';
import { FiscalEvent } from '../../src/modules/fiscal-documents/domain/entities/fiscal-event.entity';

/// Integração com Postgres real (sem mock de banco — `common/testing.md`).
///
/// Existe porque os testes de caso de uso usam o repositório em memória, que
/// guarda a entidade inteira. O repositório Prisma monta o `create` campo a
/// campo, e um campo esquecido ali é descartado em silêncio: a entidade sai
/// correta do caso de uso, o teste passa, e o dado nunca chega ao banco.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb('PrismaFiscalEventRepository (Postgres real)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaFiscalEventRepository(prisma);
  const companyId = randomUUID();
  const documentId = randomUUID();

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.company.create({
      data: {
        id: companyId,
        storeId: randomUUID(),
        cnpj: String(Date.now()).slice(0, 14),
        legalName: 'EMPRESA TESTE EVENTO FISCAL',
        taxRegime: 'SIMPLES_NACIONAL',
        cityCodeIbge: '2913606',
        uf: 'BA',
        address: { street: 'Rua Teste', number: '1', district: 'Centro' },
      },
    });
    await prisma.fiscalDocument.create({
      data: {
        id: documentId,
        companyId,
        documentType: 'NFSE',
        provider: 'SEFIN_NACIONAL',
        environment: 'HOMOLOGATION',
        status: 'AUTHORIZED',
        sourceSystem: 'teste-integracao',
        externalReference: `EVT-${Date.now()}`,
        idempotencyKey: `evt-${Date.now()}`,
        series: '1',
        number: '1',
        totalAmount: '100.00',
      },
    });
  });

  afterAll(async () => {
    await prisma.fiscalEvent.deleteMany({
      where: { fiscalDocumentId: documentId },
    });
    await prisma.fiscalDocument.delete({ where: { id: documentId } });
    await prisma.company.delete({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  /// FR-011: as chaves dos envelopes são o caminho pelo qual a auditoria chega
  /// ao XML. Persistir `null` aqui é pior do que não ter o campo — a trilha
  /// aparenta estar completa e só falha na hora da fiscalização.
  it('persists the audit-trail object keys instead of dropping them', async () => {
    const saved = await repository.save(
      FiscalEvent.with(
        {
          fiscalDocumentId: documentId,
          eventType: 'CANCEL',
          sequence: null,
          status: 'CANCEL_AUTHORIZED',
          justification: 'Erro no preenchimento do pedido original',
          correctionText: null,
          protocol: 'proto-evt-1',
          requestXmlObjectKey: `${companyId}/nfse/exchange/${documentId}/cancel-request.xml`,
          responseXmlObjectKey: `${companyId}/nfse/exchange/${documentId}/cancel-response.xml`,
          nationalEventCode: 'e101101',
          generatorEnvironment: 2,
          replacedByDocumentId: null,
          createdAt: new Date(),
          companyId: null,
          series: null,
          numberRangeStart: null,
          numberRangeEnd: null,
        },
        randomUUID(),
      ),
    );

    // Relido do banco, não da entidade devolvida: é a leitura que prova a
    // escrita.
    const [reloaded] = await repository.findByFiscalDocumentId(documentId);

    expect(reloaded.requestXmlObjectKey).toBe(saved.requestXmlObjectKey);
    // Campos do Padrao Nacional: mesma familia de bug — existem no schema, e o
    // `create` do repositorio e o ponto onde some sem quebrar compilacao.
    expect(reloaded.nationalEventCode).toBe('e101101');
    expect(reloaded.generatorEnvironment).toBe(2);
    expect(reloaded.requestXmlObjectKey).not.toBeNull();
    expect(reloaded.responseXmlObjectKey).not.toBeNull();
  });
});
