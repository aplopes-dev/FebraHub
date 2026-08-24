import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaProviderRequestRepository } from '../../src/modules/fiscal-documents/infrastructure/database/prisma-provider-request.repository';
import { ProviderRequest } from '../../src/modules/fiscal-documents/domain/entities/provider-request.entity';

/// FR-011 (spec 002) exige que cada interação com o órgão fiscal seja
/// reconstituível em auditoria. O caso de uso monta o payload com status,
/// protocolo, chave de acesso e código de erro devolvidos pela SEFAZ — e o
/// repositório os descartava, esvaziando a trilha. Mesma família do defeito de
/// itens (D2): campo existe no schema, escrita ausente no repositório.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb('PrismaProviderRequestRepository (Postgres real)', () => {
  const prisma = new PrismaService();
  const repository = new PrismaProviderRequestRepository(prisma);
  const createdIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.providerRequest.deleteMany({
        where: { id: { in: createdIds } },
      });
    }
    await prisma.$disconnect();
  });

  it('persists requestPayload and responsePayload for the audit trail (FR-011)', async () => {
    const id = randomUUID();
    createdIds.push(id);

    const responsePayload = {
      status: 'AUTHORIZED',
      protocol: 'protocolo-123',
      accessKey: '2926081122233300018155001000000002181100060',
      errorCode: null,
    };
    const requestPayload = { operation: 'ISSUE', loteId: '42' };

    await repository.save(
      ProviderRequest.with(
        {
          fiscalDocumentId: null,
          provider: 'SEFAZ_BA_NFE',
          operation: 'ISSUE',
          requestXmlObjectKey: null,
          responseXmlObjectKey: null,
          requestPayload,
          responsePayload,
          status: 'SUCCESS',
          errorMessage: null,
          createdAt: new Date(),
        },
        id,
      ),
    );

    const row = await prisma.providerRequest.findUniqueOrThrow({
      where: { id },
    });

    expect(row.responsePayload).toEqual(responsePayload);
    expect(row.requestPayload).toEqual(requestPayload);
  });
});
