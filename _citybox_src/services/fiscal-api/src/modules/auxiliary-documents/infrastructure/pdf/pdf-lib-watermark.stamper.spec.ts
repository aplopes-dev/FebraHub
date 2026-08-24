import { PdfLibWatermarkStamper } from './pdf-lib-watermark.stamper';
import { HOMOLOGATION_WATERMARK_TEXT } from '../../domain/watermark.interface';
import {
  extractPdfText,
  extractPdfTextPerPage,
  countPdfPages,
} from '../../tests/pdf-text';

/// PDF de três páginas produzido pelo **pdfkit** — deliberadamente um motor
/// diferente do `pdf-lib` que faz a estampagem.
///
/// Isso não é conveniência: é o teste de que a estampagem funciona sobre PDF
/// que NÃO foi produzido por nós. Na Fase 2 o DANFSE pode vir da API oficial do
/// Sefin (FR-002a), e é justamente esse arquivo que precisa sair marcado.
async function makeForeignPdf(pageTexts: readonly string[]): Promise<Buffer> {
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  pageTexts.forEach((text, index) => {
    if (index > 0) doc.addPage();
    doc.fontSize(14).text(text, 50, 100);
  });
  doc.end();

  return done;
}

describe('PdfLibWatermarkStamper', () => {
  const stamper = new PdfLibWatermarkStamper();

  it('estampa a marca em TODAS as paginas, nao so na primeira', async () => {
    const original = await makeForeignPdf([
      'CONTEUDO DA PAGINA UM',
      'CONTEUDO DA PAGINA DOIS',
      'CONTEUDO DA PAGINA TRES',
    ]);

    const stamped = await stamper.stamp(original, HOMOLOGATION_WATERMARK_TEXT);
    const pages = await extractPdfTextPerPage(stamped);

    expect(pages).toHaveLength(3);
    // Uma marca só na primeira página permitiria destacar as demais e usá-las
    // como se valessem — o oposto do que FR-005 protege.
    pages.forEach((page, index) => {
      expect(page).toContain(HOMOLOGATION_WATERMARK_TEXT);
      expect(page).toContain(`PAGINA ${['UM', 'DOIS', 'TRES'][index]}`);
    });
  });

  it('preserva o conteudo original legivel por cima da marca (FR-005a)', async () => {
    const original = await makeForeignPdf(['CHAVE DE ACESSO 1234567890']);

    const stamped = await stamper.stamp(original, HOMOLOGATION_WATERMARK_TEXT);
    const text = await extractPdfText(stamped);

    // Uma marca d'água que apaga o valor da nota troca um problema por outro.
    expect(text).toContain('CHAVE DE ACESSO 1234567890');
    expect(text).toContain(HOMOLOGATION_WATERMARK_TEXT);
  });

  it('nao altera o numero de paginas', async () => {
    const original = await makeForeignPdf(['A', 'B']);

    const stamped = await stamper.stamp(original, HOMOLOGATION_WATERMARK_TEXT);

    expect(await countPdfPages(stamped)).toBe(await countPdfPages(original));
  });

  it('funciona sobre PDF produzido por motor de terceiro (independencia da fonte)', async () => {
    // O `original` vem do pdfkit; o stamper usa pdf-lib. Se alguém "simplificar"
    // movendo a estampagem para dentro de um renderizador nosso, este teste é o
    // que quebra — e é o que impede o PDF da API oficial de sair sem marca.
    const foreign = await makeForeignPdf(['DOCUMENTO EXTERNO']);

    const stamped = await stamper.stamp(foreign, HOMOLOGATION_WATERMARK_TEXT);

    expect(await extractPdfText(stamped)).toContain(
      HOMOLOGATION_WATERMARK_TEXT,
    );
  });

  it('aceita texto de marca arbitrario', async () => {
    const original = await makeForeignPdf(['X']);

    const stamped = await stamper.stamp(original, 'AMBIENTE DE TESTE');

    expect(await extractPdfText(stamped)).toContain('AMBIENTE DE TESTE');
  });

  it('devolve um PDF valido, nao o buffer de entrada', async () => {
    const original = await makeForeignPdf(['X']);

    const stamped = await stamper.stamp(original, HOMOLOGATION_WATERMARK_TEXT);

    expect(stamped).toBeInstanceOf(Buffer);
    expect(stamped.subarray(0, 5).toString()).toBe('%PDF-');
    expect(stamped.equals(original)).toBe(false);
  });
});
