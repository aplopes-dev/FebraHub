import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaFiscalDocumentRepository } from '../../src/modules/fiscal-documents/infrastructure/database/prisma-fiscal-document.repository';
import { runFiscalDocumentRepositoryContract } from '../../src/modules/fiscal-documents/tests/fiscal-document-repository.contract';

/// Integração com Postgres real (sem mock de banco — `common/testing.md`).
/// Gated por DATABASE_URL: sem banco configurado a suíte é pulada em vez de
/// falhar, mesmo padrão pedido em T089 para o handshake TLS da SEFAZ.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb('PrismaFiscalDocumentRepository (contrato, Postgres real)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaFiscalDocumentRepository(prisma);
  const companyId = randomUUID();
  const createdDocumentIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.company.create({
      data: {
        id: companyId,
        storeId: randomUUID(),
        cnpj: String(Date.now()).slice(0, 14),
        legalName: 'EMPRESA DE TESTE DE INTEGRACAO',
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
  });

  afterAll(async () => {
    if (createdDocumentIds.length > 0) {
      await prisma.fiscalDocument.deleteMany({
        where: { id: { in: createdDocumentIds } },
      });
    }
    await prisma.company.deleteMany({ where: { id: companyId } });
    await prisma.$disconnect();
  });

  runFiscalDocumentRepositoryContract(() => ({
    repository,
    companyId,
    onDocumentCreated: (id) => createdDocumentIds.push(id),
  }));
});
