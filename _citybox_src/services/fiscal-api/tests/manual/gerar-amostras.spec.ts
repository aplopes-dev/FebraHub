import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { DanfeRenderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfe.renderer';
import { DanfseRenderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfse.renderer';
import { PdfLibWatermarkStamper } from '../../src/modules/auxiliary-documents/infrastructure/pdf/pdf-lib-watermark.stamper';
import { HOMOLOGATION_WATERMARK_TEXT } from '../../src/modules/auxiliary-documents/domain/watermark.interface';
import { buildAuthorizedNfeXml } from '../../src/modules/auxiliary-documents/tests/fixtures/authorized-nfe-xml';
import { buildAuthorizedNfseXml } from '../../src/modules/auxiliary-documents/tests/fixtures/authorized-nfse-xml';
import { DanfeNfceRenderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfe-nfce.renderer';
import { DanfceA4Renderer } from '../../src/modules/auxiliary-documents/infrastructure/pdf/danfce-a4.renderer';
import { buildAuthorizedNfceXml } from '../../src/modules/auxiliary-documents/tests/fixtures/authorized-nfce-xml';

/// Gerador de amostras para a **conferência visual** exigida por SC-001/SC-003.
///
/// Não é teste: não afirma nada. É um utilitário que escreve PDFs em
/// `amostras/` (fora do versionamento) para que uma pessoa abra e julgue —
/// incluindo a conformidade do DANFSE à NT 008/2026 (spec 029, SC-001b).
///
/// O que dá para automatizar (marca d'água em todas as páginas? texto
/// extraível? seções na ordem da NT?) está coberto nos specs de renderer/reader
/// e em `pdf-lib-watermark.stamper.spec.ts`.
///
/// Rodar:
/// ```
/// pnpm --filter @citybox/fiscal-api exec jest --selectProjects manual
/// ```
///
/// As amostras saem em PARES (sem × com marca d'água) para tornar a comparação
/// possível. Desde a spec 029 (FR-014) **não** há mais marca de fornecedor —
/// o único carimbo é a marca d'água de homologação.
const OUT_DIR = join(__dirname, '../../amostras');

describe('amostras para conferencia visual (SC-001/SC-003)', () => {
  const danfe = new DanfeRenderer();
  const danfse = new DanfseRenderer();
  const stamper = new PdfLibWatermarkStamper();

  beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  function save(name: string, pdf: Buffer): void {
    const path = join(OUT_DIR, name);
    writeFileSync(path, pdf);
    console.log(`  ${name.padEnd(34)} ${(pdf.length / 1024).toFixed(0)} KB`);
  }

  it('gera as amostras de DANFE', async () => {
    const { xml } = buildAuthorizedNfeXml();
    const authorizedXml = Buffer.from(xml, 'utf-8');

    const producao = await danfe.render({ authorizedXml, isCancelled: false });
    save('danfe-1-producao.pdf', producao);

    save(
      'danfe-2-homologacao.pdf',
      await stamper.stamp(producao, HOMOLOGATION_WATERMARK_TEXT),
    );

    const cancelada = await danfe.render({ authorizedXml, isCancelled: true });
    save(
      'danfe-3-cancelada.pdf',
      await stamper.stamp(cancelada, HOMOLOGATION_WATERMARK_TEXT),
    );
  }, 60_000);

  it('gera as amostras de DANFSE', async () => {
    const { xml } = buildAuthorizedNfseXml();
    const authorizedXml = Buffer.from(xml, 'utf-8');

    const producao = await danfse.render({ authorizedXml, isCancelled: false });
    save('danfse-1-producao.pdf', producao);

    save(
      'danfse-2-homologacao.pdf',
      await stamper.stamp(producao, HOMOLOGATION_WATERMARK_TEXT),
    );

    const substituida = await danfse.render({
      authorizedXml,
      isCancelled: false,
      substitutedBy: '29136062250031609000104000000000002026080799999999',
    });
    save(
      'danfse-3-substituida.pdf',
      await stamper.stamp(substituida, HOMOLOGATION_WATERMARK_TEXT),
    );

    const cancelada = await danfse.render({ authorizedXml, isCancelled: true });
    save(
      'danfse-4-cancelada.pdf',
      await stamper.stamp(cancelada, HOMOLOGATION_WATERMARK_TEXT),
    );
  }, 60_000);

  /// ⚠️ Amostras de **cupom fiscal** (spec 005).
  ///
  /// Quatro arquivos, e a comparação entre eles é o ponto:
  ///
  /// - bobina × A4: leiautes diferentes, **mesmos fatos fiscais** (SC-007). Se
  ///   os dois discordarem em chave, total ou pagamento, é defeito.
  /// - normal × contingência: a faixa preta precisa saltar aos olhos. Sem ver
  ///   um cupom sem faixa ao lado, não há como julgar se ela chama atenção.
  ///
  /// O que conferir na bobina: ela sai com ~207pt de largura (≈73 mm). Numa
  /// impressora térmica de 80 mm o conteúdo tem de caber sem corte lateral — e
  /// é isso que nenhuma asserção resolve.
  it('gera as amostras de CUPOM FISCAL (NFC-e)', async () => {
    const bobina = new DanfeNfceRenderer();
    const a4 = new DanfceA4Renderer();

    const normal = Buffer.from(buildAuthorizedNfceXml().xml, 'utf-8');
    const contingencia = Buffer.from(
      buildAuthorizedNfceXml({ emissionType: '9' }).xml,
      'utf-8',
    );

    const render = async (
      renderer: DanfeNfceRenderer | DanfceA4Renderer,
      authorizedXml: Buffer,
    ) =>
      // Marca d'água aplicada como no caminho real, para que a amostra
      // represente o papel que o consumidor recebe. A marca de fornecedor foi
      // removida na spec 029 (FR-014).
      stamper.stamp(
        await renderer.render({ authorizedXml, isCancelled: false }),
        HOMOLOGATION_WATERMARK_TEXT,
      );

    save('cupom-1-bobina-normal.pdf', await render(bobina, normal));
    save('cupom-2-bobina-contingencia.pdf', await render(bobina, contingencia));
    save('cupom-3-a4-normal.pdf', await render(a4, normal));
    save('cupom-4-a4-contingencia.pdf', await render(a4, contingencia));
  }, 60_000);
});
