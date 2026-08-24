import { PDFDocument as PdfLibDocument } from 'pdf-lib';
import { DanfseRenderer } from './danfse.renderer';
import {
  buildAuthorizedNfseXml,
  buildAuthorizedNfseXmlFull,
} from '../../tests/fixtures/authorized-nfse-xml';
import { extractPdfText } from '../../tests/pdf-text';

describe('DanfseRenderer', () => {
  const renderer = new DanfseRenderer();

  async function renderFixture(isCancelled = false, substitutedBy?: string) {
    const { xml, accessKey } = buildAuthorizedNfseXml();
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled,
      substitutedBy,
    });
    return { pdf, accessKey, text: await extractPdfText(pdf) };
  }

  async function renderFull() {
    const { xml } = buildAuthorizedNfseXmlFull();
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });
    return { pdf, text: await extractPdfText(pdf) };
  }

  it('gera um PDF valido a partir do XML autorizado', async () => {
    const { pdf } = await renderFixture();

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('imprime a chave de acesso da NFS-e (FR-004)', async () => {
    const { accessKey, text } = await renderFixture();

    // Só os dígitos: o leiaute agrupa a chave, e fixar o separador aqui
    // quebraria numa mudança cosmética.
    expect(text.replace(/\D/g, '')).toContain(accessKey);
  });

  it('imprime prestador, tomador e o servico prestado', async () => {
    const { text } = await renderFixture();

    expect(text).toContain('RR EMPREENDIMENTOS');
    expect(text).toContain('TOMADOR DE HOMOLOGAÇÃO');
    expect(text.toUpperCase()).toContain('INSTALAÇÃO PREDIAL');
  });

  it('imprime o valor do servico e o ISS', async () => {
    const { text } = await renderFixture();

    expect(text).toContain('1.500,00');
    expect(text.toUpperCase()).toContain('ISS');
  });

  it('identifica-se como DANFSE, nao como DANFE', async () => {
    const { text } = await renderFixture();

    // Leiaute próprio (FR-002). Entregar um DANFE com dados de serviço seria
    // um documento que nenhum dos dois fiscos aceita.
    expect(text.toUpperCase()).toContain('DANFSE');
    expect(text.toUpperCase()).not.toContain('DANFE ');
  });

  it('marca a nota cancelada (FR-006)', async () => {
    const { text } = await renderFixture(true);

    expect(text.toUpperCase()).toContain('CANCELADA');
  });

  it('indica a substituicao e identifica a nota substituta (FR-006)', async () => {
    const substituta = '29136062250031609000104000000000002026080799999999';

    const { text } = await renderFixture(false, substituta);

    // Não basta dizer "substituída": sem a chave da substituta, quem recebe o
    // documento não tem como chegar à nota que vale.
    expect(text.toUpperCase()).toContain('SUBSTITU');
    expect(text.replace(/\D/g, '')).toContain(substituta);
  });

  it('gera conteudo identico para o mesmo XML (FR-008)', async () => {
    const first = await renderFixture();
    const second = await renderFixture();

    expect(second.text).toBe(first.text);
  });

  it('gera bytes idênticos para o mesmo XML (FR-008 — CreationDate ancorada)', async () => {
    // Sem CreationDate fixa o pdfkit semeia a data corrente e deriva o /ID dela,
    // fazendo dois PDFs do mesmo XML diferirem byte a byte. Ancorá-la na emissão
    // torna a geração reprodutível também nos bytes.
    const first = await renderFixture();
    const second = await renderFixture();

    expect(second.pdf.equals(first.pdf)).toBe(true);
  });

  it('pagina descrição longa sem cortar as seções seguintes (SC-005)', async () => {
    const { xml } = buildAuthorizedNfseXml({
      service: {
        description: 'Prestação de serviço detalhada. '.repeat(120),
        municipalServiceCode: '07.02',
        nationalServiceCode: '070201',
        issRate: 0.02,
        issWithheld: false,
        totalValue: 1500,
      },
    });
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });

    const doc = await PdfLibDocument.load(new Uint8Array(pdf));
    // A descrição longa empurra o conteúdo para além de uma página.
    expect(doc.getPageCount()).toBeGreaterThan(1);
    // E a seção final (valor total) continua presente — nada foi perdido.
    expect((await extractPdfText(pdf)).toUpperCase()).toContain(
      'VALOR TOTAL DA NFS-E',
    );
  });

  /// US1 (spec 029) — leiaute conforme o modelo oficial do DANFSe v2.0.
  describe('US1 — estrutura do DANFSe v2.0', () => {
    it('gera o documento em A4', async () => {
      const { pdf } = await renderFixture();
      const doc = await PdfLibDocument.load(new Uint8Array(pdf));
      const page = doc.getPage(0);
      const { width, height } = page.getSize();

      // A4 retrato em pontos (tolerância para arredondamento do pdfkit).
      expect(width).toBeCloseTo(595.28, 0);
      expect(height).toBeCloseTo(841.89, 0);
    });

    it('identifica-se como DANFSe v2.0 (modelo oficial)', async () => {
      const { text } = await renderFixture();
      const upper = text.toUpperCase();
      expect(upper).toContain('DANFSE V2.0');
      expect(upper).toContain('DOCUMENTO AUXILIAR DA NFS-E');
    });

    it('apresenta as seções do modelo oficial na ordem esperada', async () => {
      const { text } = await renderFull();
      const upper = text.toUpperCase();

      const order = [
        'CHAVE DE ACESSO DA NFS-E',
        'PRESTADOR / FORNECEDOR',
        'TOMADOR / ADQUIRENTE',
        'DESTINATÁRIO DA OPERAÇÃO',
        'INTERMEDIÁRIO DA OPERAÇÃO',
        'SERVIÇO PRESTADO',
        'TRIBUTAÇÃO MUNICIPAL (ISSQN)',
        'TRIBUTAÇÃO FEDERAL (EXCETO CBS)',
        'TRIBUTAÇÃO IBS / CBS',
        'VALOR TOTAL DA NFS-E',
        'INFORMAÇÕES COMPLEMENTARES',
      ];

      let cursor = -1;
      for (const title of order) {
        const at = upper.indexOf(title, cursor + 1);
        expect(at).toBeGreaterThan(cursor);
        cursor = at;
      }
    });
  });

  /// US2 (spec 029) — campos do modelo oficial, com omissão dos ausentes.
  describe('US2 — campos do DANFSe v2.0', () => {
    it('imprime endereço do prestador e do tomador quando presentes', async () => {
      const { text } = await renderFull();

      expect(text).toContain('Rua Marques de Paranagua');
      expect(text).toContain('Avenida Sete de Setembro');
    });

    it('imprime o intermediário quando presente', async () => {
      const { text } = await renderFull();

      expect(text.toUpperCase()).toContain('INTERMEDIÁRIO DA OPERAÇÃO');
      expect(text).toContain('INTERMEDIARIO DE PAGAMENTO SA');
    });

    it('imprime BC do ISSQN e as retenções federais', async () => {
      const { text } = await renderFull();

      expect(text.toUpperCase()).toContain('BC ISSQN');
      expect(text.toUpperCase()).toContain('TRIBUTAÇÃO FEDERAL (EXCETO CBS)');
      expect(text.toUpperCase()).toContain('IRRF');
      expect(text).toContain('1.182,50'); // valor líquido com retenções
    });

    it('mostra a estrutura fixa do modelo em branco quando ausente (SC-003)', async () => {
      const { text } = await renderFixture();
      const upper = text.toUpperCase();

      // O modelo oficial do DANFSe v2.0 tem estrutura FIXA: a seção
      // INTERMEDIÁRIO (e DESTINATÁRIO, federal, IBS/CBS) aparece sempre, com as
      // células em branco quando o XML não traz dado.
      expect(upper).toContain('INTERMEDIÁRIO DA OPERAÇÃO');
      // Mas sem o valor de intermediário (que a fixture mínima não tem) — a
      // ausência de valores falsos é garantida no reader (federalTaxes/
      // intermediary undefined), ver `nfse-xml.reader.spec.ts`.
      expect(upper).not.toContain('INTERMEDIARIO DE PAGAMENTO');
    });
  });
});
