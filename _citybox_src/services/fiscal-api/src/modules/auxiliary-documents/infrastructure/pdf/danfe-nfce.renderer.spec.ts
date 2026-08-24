import { PDFDocument } from 'pdf-lib';
import { DanfeNfceRenderer } from './danfe-nfce.renderer';
import { DanfeRenderer } from './danfe.renderer';
import { buildAuthorizedNfceXml } from '../../tests/fixtures/authorized-nfce-xml';
import { buildAuthorizedNfeXml } from '../../tests/fixtures/authorized-nfe-xml';
import { extractPdfText } from '../../tests/pdf-text';

/// Largura da bobina que a biblioteca usa para o DANFE NFC-e, em pontos
/// (`pdf-NFCe.js`: `larguraPagina = 207.5`). ≈73 mm — a faixa útil de uma
/// impressora térmica de 80 mm.
const BOBINA_WIDTH_PT = 207.5;

/// Largura de A4 retrato, para contraste. Se a bobina saísse com esta largura,
/// o cupom viria numa folha e a impressora térmica cortaria o conteúdo.
const A4_WIDTH_PT = 595;

describe('DanfeNfceRenderer (US2, FR-007)', () => {
  const renderer = new DanfeNfceRenderer();
  const fixture = buildAuthorizedNfceXml();

  async function pageSize(pdf: Buffer): Promise<{ w: number; h: number }> {
    const document = await PDFDocument.load(pdf);
    const { width, height } = document.getPage(0).getSize();
    return { w: width, h: height };
  }

  it('sai em largura de BOBINA, nao em A4', async () => {
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(fixture.xml, 'utf-8'),
      isCancelled: false,
    });

    const { w, h } = await pageSize(pdf);
    expect(w).toBeCloseTo(BOBINA_WIDTH_PT, 0);
    expect(w).toBeLessThan(A4_WIDTH_PT / 2);
    // Estreita e alta: é o formato de bobina contínua.
    expect(h).toBeGreaterThan(w * 2);
  }, 30_000);

  it('imprime a chave de acesso e o protocolo', async () => {
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(fixture.xml, 'utf-8'),
      isCancelled: false,
    });

    const digits = (await extractPdfText(pdf)).replace(/\D/g, '');
    expect(digits).toContain(fixture.accessKey);
    expect(digits).toContain(fixture.protocol);
  }, 30_000);

  it('imprime quantidade, valor unitario e total do item', async () => {
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(fixture.xml, 'utf-8'),
      isCancelled: false,
    });

    const text = (await extractPdfText(pdf)).toUpperCase().replace(/\s/g, '');
    expect(text).toContain('2,00'); // quantidade
    expect(text).toContain('42,50'); // valor unitário
    expect(text).toContain('85,00'); // total
    expect(text).toContain('DINHEIRO'); // forma de pagamento
    expect(text).toContain('TROCO');
  }, 30_000);

  it('em homologacao a DESCRICAO do item sai mascarada, e isso e correto', async () => {
    // ⚠️ Descoberto ao ver o PDF, não presumido: a biblioteca substitui
    // `xProd` por "NOTA FISCAL EMITIDA EM AMB" quando `tpAmb !== '1'`
    // (`pdf-NFCe.js:176`), implementando a regra da SEFAZ para homologação.
    //
    // Uma asserção ingênua por "CIMENTO" falharia aqui e pareceria defeito do
    // renderizador. O teste registra o comportamento real para que a próxima
    // pessoa não gaste tempo perseguindo o fantasma — e para que a remoção
    // dessa máscara, se algum dia acontecer, apareça como quebra.
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(fixture.xml, 'utf-8'),
      isCancelled: false,
    });

    const text = (await extractPdfText(pdf)).toUpperCase();
    // Truncado pela própria biblioteca para caber na largura da bobina
    // (`ajusteTamanhoTexto`) — daí o prefixo, e não o texto inteiro.
    expect(text).toContain('NOTA FISCAL EMITIDA EM AM');
    expect(text).not.toContain('CIMENTO');
  }, 30_000);

  it('imprime a URL de consulta por chave (urlChave)', async () => {
    // Vem de `infNFeSupl`. Se o suplemento não tivesse sido inserido, este
    // teste falharia — e é por isso que o fixture monta o grupo pelo código de
    // produção em vez de escrevê-lo à mão.
    const pdf = await renderer.render({
      authorizedXml: Buffer.from(fixture.xml, 'utf-8'),
      isCancelled: false,
    });

    expect((await extractPdfText(pdf)).toLowerCase()).toContain(
      'sefaz.ba.gov.br',
    );
  }, 30_000);

  it('⚠️ recusa XML de NF-e (modelo 55) em vez de imprimir cupom errado', async () => {
    // A biblioteca despacha por `ide.mod` e devolveria um DANFE A4 sem
    // reclamar. Um documento de modelo 55 saindo pelo renderizador de cupom é
    // erro de roteamento, e imprimir em silêncio esconderia o defeito.
    const nfe = buildAuthorizedNfeXml();

    await expect(
      renderer.render({
        authorizedXml: Buffer.from(nfe.xml, 'utf-8'),
        isCancelled: false,
      }),
    ).rejects.toThrow();
  }, 30_000);

  it('o renderizador de NF-e continua produzindo A4', async () => {
    // Regressão no sentido inverso: parametrizar o modelo não pode ter mudado
    // o caminho da NF-e, que é o que já está em produção.
    const pdf = await new DanfeRenderer().render({
      authorizedXml: Buffer.from(buildAuthorizedNfeXml().xml, 'utf-8'),
      isCancelled: false,
    });

    expect((await pageSize(pdf)).w).toBeCloseTo(A4_WIDTH_PT, -1);
  }, 30_000);
});
