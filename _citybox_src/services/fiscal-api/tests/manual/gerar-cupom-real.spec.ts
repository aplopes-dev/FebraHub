import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DanfeNfceRenderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfe-nfce.renderer';
import { DanfceA4Renderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfce-a4.renderer';
import { PdfLibWatermarkStamper } from '../../src/modules/auxiliary-documents/infrastructure/pdf/pdf-lib-watermark.stamper';
import { HOMOLOGATION_WATERMARK_TEXT } from '../../src/modules/auxiliary-documents/domain/watermark.interface';

/// Renderiza os documentos auxiliares a partir do **XML que foi realmente
/// transmitido à SEFAZ** — não de um fixture.
///
/// A diferença importa: o fixture é montado pelos builders com dados de teste;
/// este arquivo saiu da emissão de verdade, assinado com o certificado A1 da
/// empresa e enviado ao SVRS. O que você vê no PDF é o que o consumidor
/// receberia.
///
/// **O único elemento sintético é o `protNFe`**, e é inevitável: o cupom foi
/// recusado (`462 — CSC não cadastrado`), então a SEFAZ nunca devolveu
/// protocolo. Está marcado no arquivo para não se confundir com autorização
/// real.
///
/// Rodar:
/// ```
/// pnpm --filter @citybox/fiscal-api exec jest --selectProjects manual -t "cupom real"
/// ```
const OUT_DIR = join(__dirname, '../../amostras');
const XML_PATH = join(OUT_DIR, 'cupom-REAL-transmitido.xml');

const describeIfXml = existsSync(XML_PATH) ? describe : describe.skip;

describeIfXml('amostras do cupom real transmitido', () => {
  it('gera bobina e A4 a partir do XML real', async () => {
    mkdirSync(OUT_DIR, { recursive: true });

    const signed = readFileSync(XML_PATH, 'utf-8').replace(
      /^<\?xml[^?]*\?>\s*/,
      '',
    );
    const accessKey = /<chNFe>|Id="NFe(\d{44})"/.exec(signed)?.[1] ?? '';

    // `nfeProc` com protocolo SINTÉTICO. O renderizador exige o envelope de
    // autorização, e este cupom não tem — ver o comentário do arquivo.
    const authorized = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">',
      signed,
      '<protNFe versao="4.00"><infProt>',
      '<tpAmb>2</tpAmb><verAplic>PROTOCOLO-SINTETICO-NAO-AUTORIZADO</verAplic>',
      `<chNFe>${accessKey}</chNFe>`,
      '<dhRecbto>2026-08-09T14:44:20-03:00</dhRecbto>',
      '<nProt>000000000000000</nProt>',
      '<digVal>c2ludGV0aWNvMDAwMDAwMDAwMDAwMA==</digVal>',
      '<cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo>',
      '</infProt></protNFe></nfeProc>',
    ].join('');

    writeFileSync(join(OUT_DIR, 'cupom-REAL-autorizado-sintetico.xml'), authorized);

    const water = new PdfLibWatermarkStamper();
    const authorizedXml = Buffer.from(authorized, 'utf-8');

    // Marca de fornecedor removida na spec 029 (FR-014): só a marca d'água.
    const render = async (r: DanfeNfceRenderer | DanfceA4Renderer) =>
      water.stamp(
        await r.render({ authorizedXml, isCancelled: false }),
        HOMOLOGATION_WATERMARK_TEXT,
      );

    for (const [nome, renderer] of [
      ['cupom-REAL-bobina.pdf', new DanfeNfceRenderer()],
      ['cupom-REAL-a4.pdf', new DanfceA4Renderer()],
    ] as const) {
      const pdf = await render(renderer);
      writeFileSync(join(OUT_DIR, nome), pdf);
      console.log(`  ${nome.padEnd(28)} ${(pdf.length / 1024).toFixed(0)} KB`);
    }
  }, 90_000);
});
