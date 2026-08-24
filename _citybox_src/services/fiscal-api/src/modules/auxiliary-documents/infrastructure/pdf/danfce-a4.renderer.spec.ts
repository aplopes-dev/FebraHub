import { PDFDocument } from 'pdf-lib';
import { DanfceA4Renderer } from './danfce-a4.renderer';
import { DanfeNfceRenderer } from './danfe-nfce.renderer';
import { buildAuthorizedNfceXml } from '../../tests/fixtures/authorized-nfce-xml';
import { buildAuthorizedNfeXml } from '../../tests/fixtures/authorized-nfe-xml';
import { extractPdfText } from '../../tests/pdf-text';

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;

describe('DanfceA4Renderer (US2, FR-007a)', () => {
  const renderer = new DanfceA4Renderer();
  const fixture = buildAuthorizedNfceXml();

  async function render(xml = fixture.xml): Promise<Buffer> {
    return renderer.render({
      authorizedXml: Buffer.from(xml, 'utf-8'),
      isCancelled: false,
    });
  }

  it('sai em A4 retrato', async () => {
    const document = await PDFDocument.load(await render());
    const { width, height } = document.getPage(0).getSize();

    expect(width).toBeCloseTo(A4_WIDTH_PT, 0);
    expect(height).toBeCloseTo(A4_HEIGHT_PT, 0);
  }, 30_000);

  it('imprime chave de acesso, protocolo, itens, totais e pagamentos', async () => {
    const text = await extractPdfText(await render());
    const digits = text.replace(/\D/g, '');
    const compact = text.toUpperCase().replace(/\s/g, '');

    expect(digits).toContain(fixture.accessKey);
    expect(digits).toContain(fixture.protocol);
    // Em homologação a descrição sai mascarada nas DUAS vias — ver
    // `HOMOLOGATION_ITEM_DESCRIPTION` no renderizador.
    expect(compact).toContain('NOTAFISCALEMITIDAEMAMBIENTE');
    expect(compact).not.toContain('CIMENTO');
    expect(compact).toContain('85,00');
    expect(compact).toContain('DINHEIRO');
  }, 30_000);

  it('identifica o cupom como NFC-e, nao como NF-e', async () => {
    // Duas vias do mesmo documento não podem se anunciar como documentos
    // diferentes: quem recebe o A4 precisa saber que é cupom.
    expect((await extractPdfText(await render())).toUpperCase()).toContain(
      'NFC-E',
    );
  }, 30_000);

  it('mostra CONSUMIDOR NAO IDENTIFICADO quando nao ha consumidor', async () => {
    // Deixar o campo em branco pareceria dado faltando. O cupom precisa dizer
    // que a ausência é intencional.
    expect((await extractPdfText(await render())).toUpperCase()).toContain(
      'CONSUMIDOR NAO IDENTIFICADO',
    );
  }, 30_000);

  it('marca o cupom cancelado quando pedido', async () => {
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(fixture.xml, 'utf-8'),
      isCancelled: true,
    });

    expect((await extractPdfText(pdf)).toUpperCase()).toContain('CANCELAD');
  }, 30_000);

  it('recusa XML de NF-e (modelo 55)', async () => {
    await expect(render(buildAuthorizedNfeXml().xml)).rejects.toThrow();
  }, 30_000);

  /// ⚠️ SC-007 — T036.
  ///
  /// Duas vias do MESMO cupom com dados diferentes é **defeito**, não variação
  /// de formato. O leiaute pode divergir à vontade; os fatos fiscais, não.
  describe('⚠️ bobina e A4 dizem a MESMA coisa (SC-007)', () => {
    it('mesma chave, mesmo protocolo, mesmo total nas duas vias', async () => {
      const bobina = await new DanfeNfceRenderer().render({
        authorizedXml: Buffer.from(fixture.xml, 'utf-8'),
        isCancelled: false,
      });
      const a4 = await render();

      const digitsOf = async (pdf: Buffer) =>
        (await extractPdfText(pdf)).replace(/\D/g, '');

      const dBobina = await digitsOf(bobina);
      const dA4 = await digitsOf(a4);

      for (const fato of [fixture.accessKey, fixture.protocol]) {
        expect(dBobina).toContain(fato);
        expect(dA4).toContain(fato);
      }

      const compactOf = async (pdf: Buffer) =>
        (await extractPdfText(pdf)).toUpperCase().replace(/\s/g, '');
      const cBobina = await compactOf(bobina);
      const cA4 = await compactOf(a4);

      // ⚠️ Esta asserção pegou uma divergência real: a bobina mascara a
      // descrição do item em homologação (regra da SEFAZ, implementada pela
      // biblioteca) e o A4 mostrava a descrição verdadeira. Duas vias do mesmo
      // cupom com produtos diferentes escritos.
      for (const fato of ['85,00', 'DINHEIRO', 'NOTAFISCALEMITIDAEMAM']) {
        expect(cBobina).toContain(fato);
        expect(cA4).toContain(fato);
      }
      expect(cBobina).not.toContain('CIMENTO');
      expect(cA4).not.toContain('CIMENTO');
    }, 60_000);
  });
});
