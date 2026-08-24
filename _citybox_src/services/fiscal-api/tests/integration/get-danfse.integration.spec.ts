import { randomUUID } from 'crypto';
import { PrismaService } from '../../src/shared/infra/prisma/prisma.service';
import { PrismaFiscalDocumentRepository } from '../../src/modules/fiscal-documents/infrastructure/database/prisma-fiscal-document.repository';
import { InMemoryObjectStorage } from '../../src/shared/infra/storage/in-memory-object-storage';
import { PrismaFiscalEventRepository } from '../../src/modules/fiscal-documents/infrastructure/database/prisma-fiscal-event.repository';
import { GetAuxiliaryDocumentUseCase } from '../../src/modules/auxiliary-documents/application/use-cases/get-auxiliary-document/get-auxiliary-document.use-case';
import { DanfeRenderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfe.renderer';
import { DanfseRenderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfse.renderer';
import { DanfeNfceRenderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfe-nfce.renderer';
import { DanfceA4Renderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfce-a4.renderer';
import { NoOfficialSource } from '../../src/modules/auxiliary-documents/domain/official-source.interface';
import { AllowAllCompanyAccessPolicy } from '../../src/shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../src/shared/infra/http/auth/authenticated-user';
import { PdfLibWatermarkStamper } from '../../src/modules/auxiliary-documents/infrastructure/pdf/pdf-lib-watermark.stamper';
import { FiscalDocumentNotFoundError } from '../../src/modules/fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { DocumentNotPrintableError } from '../../src/modules/auxiliary-documents/domain/errors/document-not-printable.error';
import { buildAuthorizedNfseXml } from '../../src/modules/auxiliary-documents/tests/fixtures/authorized-nfse-xml';
import { extractPdfText } from '../../src/modules/auxiliary-documents/tests/pdf-text';
import { HOMOLOGATION_WATERMARK_TEXT } from '../../src/modules/auxiliary-documents/domain/watermark.interface';
import type { FiscalDocumentStatus } from '../../src/modules/fiscal-documents/domain/entities/fiscal-document.entity';

/// Integração com Postgres real. Mesmo gate por DATABASE_URL das demais.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb(
  'GET /v1/nfse/{id}/danfse (Postgres real, renderizador real)',
  () => {
    const prisma = new PrismaService();
    const storage = new InMemoryObjectStorage();
    const useCase = new GetAuxiliaryDocumentUseCase(
      new PrismaFiscalDocumentRepository(prisma),
      storage,
      {
        NFE: { DEFAULT: new DanfeRenderer(), A4: new DanfeRenderer() },
        NFSE: { DEFAULT: new DanfseRenderer(), A4: new DanfseRenderer() },
        NFCE: {
          DEFAULT: new DanfeNfceRenderer(),
          A4: new DanfceA4Renderer(),
        },
      },
      new PdfLibWatermarkStamper(),
      // `NoOfficialSource` reproduz o comportamento de HOJE: o Sefin responde
      // 501, então a geração local é o caminho real. Quando o órgão publicar o
      // serviço, é este dublê que muda — não o use case.
      {
        NFE: new NoOfficialSource(),
        NFSE: new NoOfficialSource(),
        NFCE: new NoOfficialSource(),
      },
      new PrismaFiscalEventRepository(prisma),
      // Permissiva de propósito — a autorização real tem suíte própria
      // (`company-access-policy.integration.spec.ts`).
      new AllowAllCompanyAccessPolicy(),
    );

    const USER: AuthenticatedUser = { sub: 'integration-sub', roles: [] };

    const companyId = randomUUID();
    const otherCompanyId = randomUUID();
    const createdDocumentIds: string[] = [];
    const fixture = buildAuthorizedNfseXml();

    async function createCompany(id: string, cnpjSeed: number) {
      await prisma.company.create({
        data: {
          id,
          storeId: randomUUID(),
          cnpj: String(Date.now() + cnpjSeed).slice(0, 14),
          legalName: 'PRESTADORA DE TESTE DE INTEGRACAO',
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

    async function seedDocument(
      overrides: {
        status?: FiscalDocumentStatus;
        environment?: 'HOMOLOGATION' | 'PRODUCTION';
        ownerId?: string;
      } = {},
    ): Promise<string> {
      const id = randomUUID();
      const xmlObjectKey = `${id}.xml`;

      await prisma.fiscalDocument.create({
        data: {
          id,
          companyId: overrides.ownerId ?? companyId,
          documentType: 'NFSE',
          provider: 'SEFIN_NACIONAL',
          environment: overrides.environment ?? 'HOMOLOGATION',
          status: overrides.status ?? 'AUTHORIZED',
          sourceSystem: 'integration-test',
          externalReference: `ref-${id}`,
          idempotencyKey: `idem-${id}`,
          rpsSeries: '1',
          rpsNumber: '1',
          accessKey: fixture.accessKey,
          protocol: fixture.accessKey,
          totalAmount: 1500,
          xmlObjectKey,
        },
      });
      createdDocumentIds.push(id);

      await storage.put({
        key: xmlObjectKey,
        buffer: Buffer.from(fixture.xml, 'utf-8'),
        mimeType: 'application/xml',
      });

      return id;
    }

    beforeAll(async () => {
      await prisma.$connect();
      await createCompany(companyId, 0);
      await createCompany(otherCompanyId, 1);
    });

    afterAll(async () => {
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

    it('entrega PDF com chave, prestador, tomador e valores', async () => {
      const id = await seedDocument();

      const result = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });
      const text = await extractPdfText(result.content);

      expect(result.mimeType).toBe('application/pdf');
      expect(text.replace(/\D/g, '')).toContain(fixture.accessKey);
      expect(text).toContain('RR EMPREENDIMENTOS');
      expect(text).toContain('TOMADOR DE HOMOLOGAÇÃO');
      expect(text).toContain('1.500,00');
    }, 30_000);

    it('usa o leiaute do DANFSE, nao o do DANFE (FR-002)', async () => {
      const id = await seedDocument();

      const text = await extractPdfText(
        (await useCase.execute({ fiscalDocumentId: id, companyId, user: USER }))
          .content,
      );

      // São dois documentos distintos, com legislações distintas. Entregar um
      // DANFE com dados de serviço produz papel que nenhum dos dois fiscos
      // aceita.
      expect(text.toUpperCase()).toContain('DANFSE');
    }, 30_000);

    it('nomeia o arquivo como DANFSE, nao DANFE', async () => {
      const id = await seedDocument();

      const result = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });

      expect(result.fileName).toBe(`DANFSE-${fixture.accessKey}.pdf`);
    }, 30_000);

    it('reporta origem LOCAL enquanto o Sefin responde 501 (FR-002b)', async () => {
      const id = await seedDocument();

      const result = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });

      expect(result.origin).toBe('LOCAL');
    }, 30_000);

    it('estampa a marca d agua em homologacao (FR-005)', async () => {
      const id = await seedDocument({ environment: 'HOMOLOGATION' });

      const result = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });

      expect(await extractPdfText(result.content)).toContain(
        HOMOLOGATION_WATERMARK_TEXT,
      );
      expect(result.isFiscallyValid).toBe(false);
    }, 30_000);

    it('NAO imprime marca de fornecedor no rodape (FR-014, spec 029)', async () => {
      const id = await seedDocument({});

      const result = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });

      const text = await extractPdfText(result.content);
      // A marca Citybox (logo + legenda) foi removida: documento padronizado
      // não exibe marca de fornecedor concorrendo com a identidade nacional.
      expect(text).not.toContain('citybox.com.br');
      expect(text.toLowerCase()).not.toContain('plataforma citybox');
    }, 30_000);

    it('recusa nota rejeitada (FR-003)', async () => {
      const id = await seedDocument({ status: 'REJECTED' });

      await expect(
        useCase.execute({ fiscalDocumentId: id, companyId, user: USER }),
      ).rejects.toBeInstanceOf(DocumentNotPrintableError);
    }, 30_000);

    it('recusa nota de outro emitente com NotFound (FR-007)', async () => {
      const id = await seedDocument();

      await expect(
        useCase.execute({
          fiscalDocumentId: id,
          companyId: otherCompanyId,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
    }, 30_000);

    it('produz conteudo identico em duas geracoes (SC-004)', async () => {
      const id = await seedDocument();

      const first = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });
      const second = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });

      expect(await extractPdfText(second.content)).toBe(
        await extractPdfText(first.content),
      );
    }, 30_000);
  },
);
