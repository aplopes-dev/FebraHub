import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaContingencyQueueRepository } from '../../src/modules/nfce/infrastructure/contingency/prisma-contingency-queue.repository';
import { FiscalDocument } from '../../src/modules/fiscal-documents/domain/entities/fiscal-document.entity';
import { PrismaFiscalDocumentRepository } from '../../src/modules/fiscal-documents/infrastructure/database/prisma-fiscal-document.repository';

/// T050 — a fila de contingência contra **Postgres real**.
///
/// ⚠️ **Esta suíte não é opcional, e o dublê em memória não a substitui.**
///
/// Cada linha da fila representa um cupom que **já foi impresso e entregue ao
/// consumidor**. As propriedades que importam aqui — durabilidade, ordem sob
/// concorrência, as constraints que impedem estado inconsistente — são
/// **indistinguíveis** num `Map`: ele passa exatamente igual a uma tabela.
///
/// Esta base já pagou por essa lição uma vez: um vazamento de tenant sobreviveu
/// à suíte porque o dublê repetia o defeito do real.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb('PrismaContingencyQueueRepository (Postgres real)', () => {
  const prisma = new PrismaService();
  const queue = new PrismaContingencyQueueRepository(prisma);
  const documents = new PrismaFiscalDocumentRepository(prisma);

  const companyId = randomUUID();
  const otherCompanyId = randomUUID();
  const createdDocumentIds: string[] = [];

  async function seedCompany(id: string, cnpjSeed: number): Promise<void> {
    await prisma.company.create({
      data: {
        id,
        storeId: randomUUID(),
        cnpj: String(Date.now() + cnpjSeed).slice(0, 14),
        legalName: 'EMPRESA DE TESTE DE CONTINGENCIA',
        taxRegime: 'SIMPLES_NACIONAL',
        cityCodeIbge: '2913606',
        uf: 'BA',
        address: {
          street: 'Rua Teste',
          number: '1',
          complement: null,
          district: 'Centro',
          city: 'Ilheus',
          zipCode: '45650000',
        },
      },
    });
  }

  async function seedCupom(owner = companyId): Promise<string> {
    const id = randomUUID();
    await documents.save(
      FiscalDocument.with(
        {
          companyId: owner,
          customerId: null,
          documentType: 'NFCE',
          provider: 'SEFAZ_BA_NFE',
          environment: 'HOMOLOGATION',
          status: 'SIGNED',
          sourceSystem: 'pdv',
          externalReference: `ref-${id}`,
          idempotencyKey: `idem-${id}`,
          series: '1',
          number: '1',
          rpsSeries: null,
          rpsNumber: null,
          accessKey: null,
          verificationCode: null,
          protocol: null,
          totalAmount: 85,
          xmlObjectKey: null,
          errorCode: null,
          errorMessage: null,
          issuedAt: new Date(),
          authorizedAt: null,
          cancelledAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        id,
      ),
    );
    createdDocumentIds.push(id);
    return id;
  }

  beforeAll(async () => {
    await prisma.$connect();
    await seedCompany(companyId, 0);
    await seedCompany(otherCompanyId, 1);
  });

  afterAll(async () => {
    // Ordem importa: a FK é `ON DELETE RESTRICT`, então a fila sai primeiro.
    // Que essa limpeza precise ser explícita é, ela própria, a demonstração da
    // constraint funcionando.
    await prisma.$executeRaw`
      DELETE FROM fiscal.nfce_contingency_queue
      WHERE company_id IN (${companyId}::uuid, ${otherCompanyId}::uuid)
    `;
    if (createdDocumentIds.length > 0) {
      await prisma.fiscalDocument.deleteMany({
        where: { id: { in: createdDocumentIds } },
      });
    }
    await prisma.company.deleteMany({
      where: { id: { in: [companyId, otherCompanyId] } },
    });
    await prisma.$disconnect();
  });

  it('⚠️ a fila SOBREVIVE a reinicializacao', async () => {
    const documentId = await seedCupom();
    await queue.enqueue({
      fiscalDocumentId: documentId,
      companyId,
      emittedAt: new Date(),
    });

    // Instância nova, conexão nova: é o que um restart do processo faz. Um
    // `Map` em memória perderia tudo aqui, e é exatamente por isso que a suíte
    // de unidade não prova nada sobre durabilidade.
    const outroProcesso = new PrismaContingencyQueueRepository(
      new PrismaService(),
    );
    const pendentes = await outroProcesso.findPending(companyId, 10);

    expect(pendentes.map((e) => e.fiscalDocumentId)).toContain(documentId);
  }, 30_000);

  it('atribui sequence crescente por Emitente', async () => {
    const primeiro = await seedCupom();
    const segundo = await seedCupom();

    const a = await queue.enqueue({
      fiscalDocumentId: primeiro,
      companyId,
      emittedAt: new Date(),
    });
    const b = await queue.enqueue({
      fiscalDocumentId: segundo,
      companyId,
      emittedAt: new Date(),
    });

    expect(b.sequence).toBeGreaterThan(a.sequence);
  }, 30_000);

  it('⚠️ dois enqueue CONCORRENTES nao disputam a mesma posicao', async () => {
    // A `sequence` é calculada dentro do INSERT por subconsulta, justamente
    // para o Postgres serializar. Um `SELECT MAX` seguido de `INSERT` leria o
    // mesmo máximo nos dois e colidiria — e essa corrida é invisível num
    // dublê, que é sequencial por natureza.
    const ids = await Promise.all([seedCupom(), seedCupom(), seedCupom()]);

    const entradas = await Promise.all(
      ids.map((fiscalDocumentId) =>
        queue.enqueue({ fiscalDocumentId, companyId, emittedAt: new Date() }),
      ),
    );

    const sequences = entradas.map((e) => e.sequence);
    expect(new Set(sequences.map(String)).size).toBe(3);
  }, 30_000);

  it('sequences sao independentes entre Emitentes', async () => {
    const meu = await seedCupom(companyId);
    const alheio = await seedCupom(otherCompanyId);

    await queue.enqueue({
      fiscalDocumentId: meu,
      companyId,
      emittedAt: new Date(),
    });
    const outra = await queue.enqueue({
      fiscalDocumentId: alheio,
      companyId: otherCompanyId,
      emittedAt: new Date(),
    });

    // A fila de um contribuinte não pode empurrar a posição do outro.
    expect(outra.sequence).toBe(1n);
  }, 30_000);

  it('findPending devolve na ORDEM de sequence', async () => {
    const criados: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const id = await seedCupom();
      criados.push(id);
      await queue.enqueue({
        fiscalDocumentId: id,
        companyId,
        emittedAt: new Date(),
      });
    }

    const pendentes = await queue.findPending(companyId, 100);
    const posicoes = criados.map((id) =>
      pendentes.findIndex((e) => e.fiscalDocumentId === id),
    );

    expect(posicoes).toEqual([...posicoes].sort((a, b) => a - b));
  }, 30_000);

  it('findPending nao devolve entrada de OUTRO Emitente', async () => {
    const alheio = await seedCupom(otherCompanyId);
    await queue.enqueue({
      fiscalDocumentId: alheio,
      companyId: otherCompanyId,
      emittedAt: new Date(),
    });

    const pendentes = await queue.findPending(companyId, 100);
    expect(pendentes.map((e) => e.fiscalDocumentId)).not.toContain(alheio);
  }, 30_000);

  it('markTransmitted grava status e carimbo JUNTOS', async () => {
    const id = await seedCupom();
    const entrada = await queue.enqueue({
      fiscalDocumentId: id,
      companyId,
      emittedAt: new Date(),
    });

    await queue.markTransmitted(entrada.id, new Date());

    const pendentes = await queue.findPending(companyId, 100);
    expect(pendentes.map((e) => e.id)).not.toContain(entrada.id);
  }, 30_000);

  it('⚠️ o banco RECUSA status TRANSMITTED sem carimbo', async () => {
    // A CHECK constraint da migration. Sem ela, a fila poderia ter linha que
    // "parece resolvida" — e numa fila cuja razão de existir é não perder
    // cupom entregue, estado inconsistente é pior que erro.
    const id = await seedCupom();
    const entrada = await queue.enqueue({
      fiscalDocumentId: id,
      companyId,
      emittedAt: new Date(),
    });

    await expect(
      prisma.$executeRaw`
        UPDATE fiscal.nfce_contingency_queue
        SET status = 'TRANSMITTED', updated_at = NOW()
        WHERE id = ${entrada.id}::uuid
      `,
    ).rejects.toThrow();
  }, 30_000);

  it('⚠️ o banco RECUSA apagar o documento com entrada na fila', async () => {
    // `ON DELETE RESTRICT`, não CASCADE. Apagar em cascata deixaria papel na
    // mão do cliente sem correspondência no sistema, em silêncio.
    const id = await seedCupom();
    await queue.enqueue({
      fiscalDocumentId: id,
      companyId,
      emittedAt: new Date(),
    });

    await expect(
      prisma.fiscalDocument.delete({ where: { id } }),
    ).rejects.toThrow();
  }, 30_000);

  it('markRejected PRESERVA a linha, com o erro', async () => {
    // FR-012: o rastro de um cupom que o consumidor levou e o fisco recusou é
    // exatamente o que precisa sobreviver.
    const id = await seedCupom();
    const entrada = await queue.enqueue({
      fiscalDocumentId: id,
      companyId,
      emittedAt: new Date(),
    });

    await queue.markRejected(entrada.id, 'rejeitado pela SEFAZ: 539');

    const rows = await prisma.$queryRaw<
      { status: string; last_error: string | null }[]
    >`
      SELECT status::text, last_error
      FROM fiscal.nfce_contingency_queue
      WHERE id = ${entrada.id}::uuid
    `;
    expect(rows[0].status).toBe('REJECTED');
    expect(rows[0].last_error).toContain('539');
  }, 30_000);

  it('findOverdue encontra os antigos, de qualquer Emitente', async () => {
    const antigo = await seedCupom();
    await queue.enqueue({
      fiscalDocumentId: antigo,
      companyId,
      emittedAt: new Date(Date.now() - 48 * 3_600_000),
    });

    const atrasados = await queue.findOverdue(
      new Date(Date.now() - 24 * 3_600_000),
      100,
    );

    expect(atrasados.map((e) => e.fiscalDocumentId)).toContain(antigo);
  }, 30_000);
});
