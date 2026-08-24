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
import { AuthorizedXmlUnavailableError } from '../../src/modules/auxiliary-documents/domain/errors/authorized-xml-unavailable.error';
import { buildAuthorizedNfeXml } from '../../src/modules/auxiliary-documents/tests/fixtures/authorized-nfe-xml';
import { extractPdfText } from '../../src/modules/auxiliary-documents/tests/pdf-text';
import { HOMOLOGATION_WATERMARK_TEXT } from '../../src/modules/auxiliary-documents/domain/watermark.interface';
import type { FiscalDocumentStatus } from '../../src/modules/fiscal-documents/domain/entities/fiscal-document.entity';

/// Integração com Postgres real (sem mock de banco). Gated por DATABASE_URL:
/// sem banco configurado a suíte é pulada em vez de falhar — mesmo padrão das
/// demais integrações deste serviço.
///
/// O que esta suíte cobre e a de unidade não: o caminho **inteiro** com as
/// implementações reais — repositório Prisma, renderizador da biblioteca e
/// estampagem —, em vez de dublês. Um teste de unidade com renderizador falso
/// passa mesmo que a biblioteca real produza PDF ilegível.
const describeIfDb = process.env.DATABASE_URL ? describe : describe.skip;

describeIfDb(
  'GET /v1/nfe/{id}/danfe (Postgres real, renderizador real)',
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
      {
        NFE: new NoOfficialSource(),
        NFSE: new NoOfficialSource(),
        NFCE: new NoOfficialSource(),
      },
      new PrismaFiscalEventRepository(prisma),
      // Política permissiva de propósito: esta suíte cobre a LÓGICA do
      // documento. A autorização real tem suíte própria
      // (`company-access-policy.integration.spec.ts`), que exige linhas em
      // `platform.store_members` — misturar as duas faria cada teste de
      // leiaute depender de montar participação em loja.
      new AllowAllCompanyAccessPolicy(),
    );

    const USER: AuthenticatedUser = { sub: 'integration-sub', roles: [] };

    const companyId = randomUUID();
    const otherCompanyId = randomUUID();
    const createdDocumentIds: string[] = [];
    const fixture = buildAuthorizedNfeXml();

    async function createCompany(id: string, cnpjSeed: number) {
      await prisma.company.create({
        data: {
          id,
          storeId: randomUUID(),
          cnpj: String(Date.now() + cnpjSeed).slice(0, 14),
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
    }

    async function seedDocument(overrides: {
      status?: FiscalDocumentStatus;
      environment?: 'HOMOLOGATION' | 'PRODUCTION';
      ownerId?: string;
      withXml?: boolean;
    }): Promise<string> {
      const id = randomUUID();
      const xmlObjectKey = overrides.withXml === false ? null : `${id}.xml`;

      await prisma.fiscalDocument.create({
        data: {
          id,
          companyId: overrides.ownerId ?? companyId,
          documentType: 'NFE',
          provider: 'SEFAZ_BA_NFE',
          environment: overrides.environment ?? 'HOMOLOGATION',
          status: overrides.status ?? 'AUTHORIZED',
          sourceSystem: 'integration-test',
          externalReference: `ref-${id}`,
          idempotencyKey: `idem-${id}`,
          series: '1',
          number: '1',
          accessKey: fixture.accessKey,
          protocol: fixture.protocol,
          totalAmount: 85,
          xmlObjectKey,
        },
      });
      createdDocumentIds.push(id);

      if (xmlObjectKey) {
        await storage.put({
          key: xmlObjectKey,
          buffer: Buffer.from(fixture.xml, 'utf-8'),
          mimeType: 'application/xml',
        });
      }

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

    it('entrega PDF cujo TEXTO contem a chave de acesso (SC-002)', async () => {
      const id = await seedDocument({});

      const result = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });

      // ⚠️ Abrir o PDF, não conferir só o tipo. Esta base já deixou uma
      // substituição de NFS-e passar por 14/14 porque a asserção parava no
      // código de status — um `200` com PDF corrompido é o mesmo risco.
      expect(result.mimeType).toBe('application/pdf');
      const digits = (await extractPdfText(result.content)).replace(/\D/g, '');
      expect(digits).toContain(fixture.accessKey);
      expect(digits).toContain(fixture.protocol);
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
      // A marca Citybox (logo + legenda) foi removida também do DANFE.
      expect(text).not.toContain('citybox.com.br');
      expect(text.toLowerCase()).not.toContain('plataforma citybox');
    }, 30_000);

    it('recusa nota rejeitada com DocumentNotPrintable (FR-003)', async () => {
      const id = await seedDocument({ status: 'REJECTED' });

      await expect(
        useCase.execute({ fiscalDocumentId: id, companyId, user: USER }),
      ).rejects.toBeInstanceOf(DocumentNotPrintableError);
    }, 30_000);

    it('recusa nota de OUTRO emitente com NotFound, nao Forbidden (FR-007)', async () => {
      const id = await seedDocument({ ownerId: companyId });

      // 404 e não 403: um 403 confirmaria que a nota existe, e a existência de
      // documento fiscal de outro contribuinte já é informação.
      await expect(
        useCase.execute({
          fiscalDocumentId: id,
          companyId: otherCompanyId,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
    }, 30_000);

    it('falha alto quando o XML autorizado nao esta armazenado (FR-010)', async () => {
      const id = await seedDocument({ withXml: false });

      await expect(
        useCase.execute({ fiscalDocumentId: id, companyId, user: USER }),
      ).rejects.toBeInstanceOf(AuthorizedXmlUnavailableError);
    }, 30_000);

    it('entrega nota cancelada MARCADA, em vez de recusar (FR-006)', async () => {
      const id = await seedDocument({ status: 'CANCEL_AUTHORIZED' });

      const result = await useCase.execute({
        fiscalDocumentId: id,
        companyId,
        user: USER,
      });

      expect((await extractPdfText(result.content)).toUpperCase()).toContain(
        'CANCEL',
      );
    }, 30_000);

    /// US3 — reimpressão.
    ///
    /// Não há código de produção próprio: reimprimir é chamar o mesmo endpoint de
    /// novo. Estes testes existem para PROVAR que é assim — se algum deles
    /// exigisse implementação nova, o design de US1 estaria errado.
    describe('US3 — reimpressao', () => {
      it('produz conteudo identico em duas geracoes (SC-004)', async () => {
        const id = await seedDocument({});

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

        // Conteúdo textual, não bytes: PDF carrega data de criação, então dois
        // arquivos do mesmo conteúdo NUNCA batem byte a byte — e isso não indica
        // defeito. Comparar `content` diretamente seria um teste que falha sempre.
        expect(await extractPdfText(second.content)).toBe(
          await extractPdfText(first.content),
        );
      }, 30_000);

      it('reflete os dados VIGENTES NA EMISSAO, nao o cadastro atual (FR-008)', async () => {
        const id = await seedDocument({});
        const before = await useCase.execute({
          fiscalDocumentId: id,
          companyId,
          user: USER,
        });

        // Muda o cadastro do emitente DEPOIS da emissão. O documento auxiliar
        // representa a nota como ela foi autorizada — não como a empresa está
        // hoje.
        await prisma.company.update({
          where: { id: companyId },
          data: { legalName: 'RAZAO SOCIAL ALTERADA DEPOIS DA EMISSAO LTDA' },
        });

        const after = await useCase.execute({
          fiscalDocumentId: id,
          companyId,
          user: USER,
        });
        const text = await extractPdfText(after.content);

        // Este é o teste que quebra se alguém fizer o renderizador ler o banco.
        // Hoje é impossível por construção: a porta recebe Buffer de XML, não a
        // entidade — mas a garantia estrutural merece uma prova executável.
        expect(text).not.toContain('ALTERADA DEPOIS DA EMISSAO');
        expect(text).toBe(await extractPdfText(before.content));
      }, 30_000);
    });
  },
);
