import { randomUUID } from 'crypto';
import { GetAuxiliaryDocumentUseCase } from './get-auxiliary-document.use-case';
import { InMemoryFiscalDocumentRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-document.repository';
import { buildFiscalDocument } from '../../../../fiscal-documents/tests/fixtures/fiscal-document.fixture';
import { InMemoryObjectStorage } from '../../../../../shared/infra/storage/in-memory-object-storage';
import { InMemoryFiscalEventRepository } from '../../../../fiscal-documents/tests/in-memory-fiscal-event.repository';
import { FiscalEvent } from '../../../../fiscal-documents/domain/entities/fiscal-event.entity';
import {
  CompanyAccessPolicy,
  AllowAllCompanyAccessPolicy,
} from '../../../../../shared/domain/tenant/company-access.policy';
import type { AuthenticatedUser } from '../../../../../shared/infra/http/auth/authenticated-user';
import { FiscalDocumentNotFoundError } from '../../../../fiscal-documents/domain/errors/fiscal-document-not-found.error';
import { DocumentNotPrintableError } from '../../../domain/errors/document-not-printable.error';
import { AuthorizedXmlUnavailableError } from '../../../domain/errors/authorized-xml-unavailable.error';
import {
  AuxiliaryDocumentRenderer,
  type RenderInput,
} from '../../../domain/renderer.interface';
import {
  WatermarkStamper,
  HOMOLOGATION_WATERMARK_TEXT,
} from '../../../domain/watermark.interface';
import {
  OfficialDocumentSource,
  NoOfficialSource,
} from '../../../domain/official-source.interface';
import type { RendererRegistry } from './get-auxiliary-document.use-case';

const COMPANY_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_COMPANY_ID = '22222222-2222-4222-8222-222222222222';

/// Solicitante autenticado. O `sub` é a única entrada da requisição que o
/// chamador não pode forjar — é dele que a autorização real parte.
const USER: AuthenticatedUser = {
  sub: 'user-sub-1',
  roles: ['fiscal_operator'],
};

/// Política que nega tudo — encena o caso em que o solicitante NÃO participa da
/// loja do Emitente informado no header.
class DenyAllCompanyAccessPolicy extends CompanyAccessPolicy {
  canActFor(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

class FakeRenderer extends AuxiliaryDocumentRenderer {
  calls: RenderInput[] = [];

  render(input: RenderInput): Promise<Buffer> {
    this.calls.push(input);
    return Promise.resolve(Buffer.from('%PDF-fake-render'));
  }
}

/// Fonte oficial que responde — o cenário que só existirá quando o Sefin
/// publicar o serviço (hoje responde 501).
class RespondingOfficialSource extends OfficialDocumentSource {
  fetch(): Promise<Buffer | null> {
    return Promise.resolve(Buffer.from('%PDF-vindo-do-orgao'));
  }
}

class FakeStamper extends WatermarkStamper {
  calls: { pdf: Buffer; text: string }[] = [];

  stamp(pdf: Buffer, text: string): Promise<Buffer> {
    this.calls.push({ pdf, text });
    return Promise.resolve(Buffer.concat([pdf, Buffer.from(`::${text}`)]));
  }
}

/// Storage que **lança** em vez de devolver vazio — é o comportamento real do
/// MinIO quando está fora do ar, e a diferença importa: devolver vazio faria o
/// renderizador produzir um PDF em branco em vez de falhar (FR-010).
class ThrowingObjectStorage extends InMemoryObjectStorage {
  get(): Promise<never> {
    return Promise.reject(new Error('connection refused'));
  }
}

/// Registro em que **todo** (tipo, formato) usa o mesmo dublê.
///
/// A dimensão de formato só importa para a NFC-e (bobina vs A4), e há suíte
/// dedicada a ela nos renderizadores. Aqui o assunto é a lógica do caso de uso,
/// e repetir o dublê seis vezes em cada teste só esconderia o que muda.
function allFormats(renderer: AuxiliaryDocumentRenderer): RendererRegistry {
  const both = { DEFAULT: renderer, A4: renderer };
  return { NFE: both, NFSE: both, NFCE: both };
}

describe('GetAuxiliaryDocumentUseCase', () => {
  let repository: InMemoryFiscalDocumentRepository;
  let storage: InMemoryObjectStorage;
  let renderer: FakeRenderer;
  let stamper: FakeStamper;
  let events: InMemoryFiscalEventRepository;
  let useCase: GetAuxiliaryDocumentUseCase;

  beforeEach(() => {
    repository = new InMemoryFiscalDocumentRepository();
    storage = new InMemoryObjectStorage();
    renderer = new FakeRenderer();
    stamper = new FakeStamper();
    events = new InMemoryFiscalEventRepository();
    useCase = new GetAuxiliaryDocumentUseCase(
      repository,
      storage,
      allFormats(renderer),
      stamper,
      {
        NFE: new NoOfficialSource(),
        NFSE: new NoOfficialSource(),
        NFCE: new NoOfficialSource(),
      },
      events,
      new AllowAllCompanyAccessPolicy(),
    );
  });

  async function seed(
    overrides: Parameters<typeof buildFiscalDocument>[0] = {},
  ) {
    const id = randomUUID();
    const document = buildFiscalDocument(
      { companyId: COMPANY_ID, xmlObjectKey: `${id}.xml`, ...overrides },
      id,
    );
    await repository.save(document);
    if (document.xmlObjectKey) {
      await storage.put({
        key: document.xmlObjectKey,
        buffer: Buffer.from('<nfeProc/>'),
        mimeType: 'application/xml',
      });
    }
    return document;
  }

  it('entrega o documento de uma nota autorizada', async () => {
    const document = await seed({ status: 'AUTHORIZED' });

    const result = await useCase.execute({
      fiscalDocumentId: document.id,
      companyId: COMPANY_ID,
      user: USER,
    });

    expect(result.mimeType).toBe('application/pdf');
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.origin).toBe('LOCAL');
  });

  it('passa ao renderizador o XML AUTORIZADO, nao dados do banco', async () => {
    // Garantia estrutural de FR-008: o renderizador só recebe o XML. Se um dia
    // passar a receber a entidade, uma mudança de cadastro pode vazar para a
    // reimpressão de uma nota antiga.
    const document = await seed();

    await useCase.execute({
      fiscalDocumentId: document.id,
      companyId: COMPANY_ID,
      user: USER,
    });

    expect(renderer.calls).toHaveLength(1);
    expect(renderer.calls[0].authorizedXml.toString()).toBe('<nfeProc/>');
  });

  it('nomeia o arquivo pela chave de acesso', async () => {
    const document = await seed({ accessKey: '4426' });

    const result = await useCase.execute({
      fiscalDocumentId: document.id,
      companyId: COMPANY_ID,
      user: USER,
    });

    expect(result.fileName).toBe('DANFE-4426.pdf');
  });

  describe('FR-003 — estado da nota', () => {
    it('recusa nota que ainda nao foi autorizada, informando o estado', async () => {
      const document = await seed({ status: 'PROCESSING' });

      await expect(
        useCase.execute({
          fiscalDocumentId: document.id,
          companyId: COMPANY_ID,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(DocumentNotPrintableError);
    });

    it('recusa nota rejeitada', async () => {
      const document = await seed({ status: 'REJECTED' });

      await expect(
        useCase.execute({
          fiscalDocumentId: document.id,
          companyId: COMPANY_ID,
          user: USER,
        }),
      ).rejects.toMatchObject({ currentStatus: 'REJECTED' });
    });

    it('ENTREGA nota cancelada, marcada como cancelada (FR-006)', async () => {
      const document = await seed({ status: 'CANCEL_AUTHORIZED' });

      const result = await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(result.content.length).toBeGreaterThan(0);
      expect(renderer.calls[0].isCancelled).toBe(true);
    });

    it('nao marca como cancelada a nota com cancelamento apenas solicitado', async () => {
      const document = await seed({ status: 'CANCEL_REQUESTED' });

      await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(renderer.calls[0].isCancelled).toBe(false);
    });
  });

  describe('FR-007 — isolamento por emitente', () => {
    it('recusa nota de outro emitente com NotFound, nao Forbidden', async () => {
      const document = await seed({ companyId: COMPANY_ID });

      // 404 e não 403: um 403 confirmaria que a nota existe, e a existência de
      // documento fiscal de outro contribuinte já é informação.
      await expect(
        useCase.execute({
          fiscalDocumentId: document.id,
          companyId: OTHER_COMPANY_ID,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
    });

    it('recusa antes de tocar no storage — nao vaza nem a existencia do XML', async () => {
      const document = await seed();
      const spy = jest.spyOn(storage, 'get');

      await expect(
        useCase.execute({
          fiscalDocumentId: document.id,
          companyId: OTHER_COMPANY_ID,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
      expect(spy).not.toHaveBeenCalled();
    });

    it('NEGA quando a politica recusa, mesmo com header e nota batendo', async () => {
      // ⚠️ O cenário do achado de segurança (HIGH, 2026-08-08). Antes da
      // política, bastava o atacante informar o `companyId` correto da vítima
      // no header para a comparação passar — ele controlava os dois lados.
      // Agora quem decide é o `sub` autenticado, que ele não forja.
      const document = await seed({ companyId: COMPANY_ID });
      const guarded = new GetAuxiliaryDocumentUseCase(
        repository,
        storage,
        allFormats(renderer),
        stamper,
        {
          NFE: new NoOfficialSource(),
          NFSE: new NoOfficialSource(),
          NFCE: new NoOfficialSource(),
        },
        events,
        new DenyAllCompanyAccessPolicy(),
      );

      await expect(
        guarded.execute({
          fiscalDocumentId: document.id,
          companyId: COMPANY_ID,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
    });

    it('recusa antes de buscar a nota quando a politica nega', async () => {
      // Recusar cedo mantém as duas falhas indistinguíveis de fora: quem sonda
      // não aprende se errou o emitente ou o id.
      const document = await seed({ companyId: COMPANY_ID });
      const spy = jest.spyOn(repository, 'findById');
      const guarded = new GetAuxiliaryDocumentUseCase(
        repository,
        storage,
        allFormats(renderer),
        stamper,
        {
          NFE: new NoOfficialSource(),
          NFSE: new NoOfficialSource(),
          NFCE: new NoOfficialSource(),
        },
        events,
        new DenyAllCompanyAccessPolicy(),
      );

      await expect(
        guarded.execute({
          fiscalDocumentId: document.id,
          companyId: COMPANY_ID,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
      expect(spy).not.toHaveBeenCalled();
    });

    it('recusa id inexistente', async () => {
      await expect(
        useCase.execute({
          fiscalDocumentId: randomUUID(),
          companyId: COMPANY_ID,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(FiscalDocumentNotFoundError);
    });
  });

  describe('FR-010 — XML autorizado indisponivel', () => {
    it('falha alto quando a nota nao tem xmlObjectKey', async () => {
      const document = await seed({ xmlObjectKey: null });

      await expect(
        useCase.execute({
          fiscalDocumentId: document.id,
          companyId: COMPANY_ID,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(AuthorizedXmlUnavailableError);
    });

    it('falha alto quando o storage lanca — nunca cai para outra fonte', async () => {
      const failing = new ThrowingObjectStorage();
      const document = buildFiscalDocument(
        { companyId: COMPANY_ID, xmlObjectKey: 'k.xml' },
        randomUUID(),
      );
      await repository.save(document);
      const useCaseWithFailingStorage = new GetAuxiliaryDocumentUseCase(
        repository,
        failing,
        allFormats(renderer),
        stamper,
        {
          NFE: new NoOfficialSource(),
          NFSE: new NoOfficialSource(),
          NFCE: new NoOfficialSource(),
        },
        events,
        new AllowAllCompanyAccessPolicy(),
      );

      await expect(
        useCaseWithFailingStorage.execute({
          fiscalDocumentId: document.id,
          companyId: COMPANY_ID,
          user: USER,
        }),
      ).rejects.toBeInstanceOf(AuthorizedXmlUnavailableError);
      // O ponto de FR-010: não existe caminho alternativo. Um PDF montado do
      // banco divergiria do que o fisco tem, sem ninguém perceber.
      expect(renderer.calls).toHaveLength(0);
    });
  });

  describe('FR-005 — marca d agua', () => {
    it('estampa o documento gerado em homologacao', async () => {
      const document = await seed({ environment: 'HOMOLOGATION' });

      const result = await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(stamper.calls).toHaveLength(1);
      expect(stamper.calls[0].text).toBe(HOMOLOGATION_WATERMARK_TEXT);
      expect(result.isFiscallyValid).toBe(false);
    });

    it('NAO estampa o documento gerado em producao', async () => {
      const document = await seed({ environment: 'PRODUCTION' });

      const result = await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(stamper.calls).toHaveLength(0);
      expect(result.isFiscallyValid).toBe(true);
    });
  });

  /// FR-006, segunda metade. Sem estes casos, o defeito volta em silêncio: o
  /// Padrão Nacional cancela a original ao aceitar a substituta, de modo que
  /// substituída e cancelada terminam **no mesmo status** — e o documento sai
  /// dizendo só "cancelada", sem apontar a nota que vale.
  describe('FR-006 — nota substituida identifica a substituta', () => {
    const SUBSTITUTE_KEY = '29136062250031609000104000000000002026080799999999';

    async function seedSubstituted() {
      const original = await seed({
        documentType: 'NFSE',
        status: 'CANCEL_AUTHORIZED',
      });
      const substitute = await seed({
        documentType: 'NFSE',
        accessKey: SUBSTITUTE_KEY,
      });
      await events.save(
        FiscalEvent.with(
          {
            fiscalDocumentId: original.id,
            eventType: 'CANCEL',
            sequence: null,
            status: 'CANCEL_AUTHORIZED',
            justification: null,
            correctionText: null,
            protocol: null,
            requestXmlObjectKey: null,
            responseXmlObjectKey: null,
            nationalEventCode: 'e105102',
            generatorEnvironment: 2,
            replacedByDocumentId: substitute.id,
            createdAt: new Date(),
            companyId: null,
            series: null,
            numberRangeStart: null,
            numberRangeEnd: null,
          },
          randomUUID(),
        ),
      );
      return original;
    }

    it('passa a chave da substituta ao renderizador', async () => {
      const original = await seedSubstituted();

      await useCase.execute({
        fiscalDocumentId: original.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(renderer.calls[0].substitutedBy).toBe(SUBSTITUTE_KEY);
    });

    it('NAO marca como simples cancelamento quando houve substituicao', async () => {
      // "NOTA CANCELADA" sozinha é verdadeira e inútil: quem recebe não tem
      // como chegar à nota que vale.
      const original = await seedSubstituted();

      await useCase.execute({
        fiscalDocumentId: original.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(renderer.calls[0].isCancelled).toBe(false);
    });

    it('cancelamento SEM substituicao segue marcado como cancelado', async () => {
      const document = await seed({ status: 'CANCEL_AUTHORIZED' });

      await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(renderer.calls[0].isCancelled).toBe(true);
      expect(renderer.calls[0].substitutedBy).toBeUndefined();
    });

    it('nao consulta eventos de nota que nao esta cancelada', async () => {
      const document = await seed({ status: 'AUTHORIZED' });
      const spy = jest.spyOn(events, 'findByFiscalDocumentId');

      await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      // Consulta desnecessária em todo DANFE emitido custaria uma ida ao banco
      // por impressão, para um caso que só existe em NFS-e cancelada.
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('FR-002a — preferencia pela API oficial', () => {
    function useCaseWithOfficial() {
      return new GetAuxiliaryDocumentUseCase(
        repository,
        storage,
        allFormats(renderer),
        stamper,
        {
          NFE: new NoOfficialSource(),
          NFSE: new RespondingOfficialSource(),
          NFCE: new NoOfficialSource(),
        },
        events,
        new AllowAllCompanyAccessPolicy(),
      );
    }

    it('prefere o documento do orgao quando ele responde', async () => {
      const document = await seed({ documentType: 'NFSE' });

      const result = await useCaseWithOfficial().execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(result.origin).toBe('OFFICIAL_API');
      // Não renderiza localmente: seria trabalho jogado fora.
      expect(renderer.calls).toHaveLength(0);
    });

    it('ESTAMPA o documento vindo do orgao em homologacao', async () => {
      // ⚠️ A regressão mais perigosa desta feature. Se alguém "simplificar"
      // movendo a marca d'água para dentro do renderizador, o PDF do órgão sai
      // SEM marcação — e FR-005 quebra justamente no caminho que FR-002a
      // prefere, sem nenhum erro visível.
      const document = await seed({
        documentType: 'NFSE',
        environment: 'HOMOLOGATION',
      });

      const result = await useCaseWithOfficial().execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(stamper.calls).toHaveLength(1);
      expect(stamper.calls[0].pdf.toString()).toContain('vindo-do-orgao');
      expect(result.isFiscallyValid).toBe(false);
    });

    it('cai para geracao local quando o orgao nao responde — o caso de hoje', async () => {
      const document = await seed({ documentType: 'NFSE' });

      const result = await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(result.origin).toBe('LOCAL');
      expect(renderer.calls).toHaveLength(1);
    });
  });

  /// FR-014 (spec 029) — a marca Citybox (logo + legenda) foi REMOVIDA de DANFE
  /// e DANFSE. Antes (spec 004 FR-011..014) ela era estampada SEMPRE; estes
  /// casos travam a ausência, para o crédito de fornecedor não voltar por
  /// descuido sobre a identidade visual nacional da NT 008/2026.
  describe('FR-014 — marca Citybox removida', () => {
    it('NAO acrescenta a marca em PRODUCTION', async () => {
      const document = await seed({ environment: 'PRODUCTION' });

      const result = await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      // Em produção não há marca d'água nem marca de fornecedor: o conteúdo é o
      // documento renderizado, sem estágio de branding.
      expect(result.content.toString()).not.toContain('CITYBOX');
      expect(stamper.calls).toHaveLength(0);
    });

    it('entrega em HOMOLOGACAO apenas com a marca d agua, sem marca de fornecedor', async () => {
      const document = await seed({ environment: 'HOMOLOGATION' });

      const result = await useCase.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      // A marca d'água (estágio separado) permanece; a marca Citybox não.
      expect(stamper.calls).toHaveLength(1);
      expect(result.content.toString()).not.toContain('CITYBOX');
    });

    it('NAO recarimba marca sobre o PDF vindo da API OFICIAL', async () => {
      // O documento do órgão sai como veio (só a marca d'água em homologação),
      // sem marca de fornecedor por cima — FR-014 vale também para o caminho
      // oficial preferido por FR-002a.
      const document = await seed({ documentType: 'NFSE' });
      const withOfficial = new GetAuxiliaryDocumentUseCase(
        repository,
        storage,
        allFormats(renderer),
        stamper,
        {
          NFE: new NoOfficialSource(),
          NFSE: new RespondingOfficialSource(),
          NFCE: new NoOfficialSource(),
        },
        events,
        new AllowAllCompanyAccessPolicy(),
      );

      const result = await withOfficial.execute({
        fiscalDocumentId: document.id,
        companyId: COMPANY_ID,
        user: USER,
      });

      expect(result.origin).toBe('OFFICIAL_API');
      expect(result.content.toString()).not.toContain('CITYBOX');
    });
  });

  it('escolhe o renderizador pelo tipo de documento', async () => {
    const danfse = new FakeRenderer();
    const useCaseWithBoth = new GetAuxiliaryDocumentUseCase(
      repository,
      storage,
      {
        NFE: { DEFAULT: renderer, A4: renderer },
        NFSE: { DEFAULT: danfse, A4: danfse },
        NFCE: { DEFAULT: renderer, A4: renderer },
      },
      stamper,
      {
        NFE: new NoOfficialSource(),
        NFSE: new NoOfficialSource(),
        NFCE: new NoOfficialSource(),
      },
      events,
      new AllowAllCompanyAccessPolicy(),
    );
    const document = await seed({ documentType: 'NFSE', accessKey: '2913' });

    const result = await useCaseWithBoth.execute({
      fiscalDocumentId: document.id,
      companyId: COMPANY_ID,
      user: USER,
    });

    expect(danfse.calls).toHaveLength(1);
    expect(renderer.calls).toHaveLength(0);
    expect(result.fileName).toBe('DANFSE-2913.pdf');
  });
});
