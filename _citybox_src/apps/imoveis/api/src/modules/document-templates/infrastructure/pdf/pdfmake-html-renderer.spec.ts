import { PdfMakeHtmlRenderer } from './pdfmake-html-renderer';

describe('PdfMakeHtmlRenderer', () => {
  it('gera um buffer PDF a partir de HTML restrito', async () => {
    const renderer = new PdfMakeHtmlRenderer();
    const buffer = await renderer.render(
      '<h1>Imob Ilhéus</h1><p>Contrato de <strong>Ana Silva</strong></p>',
      'Contrato',
    );
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(100);
  });
});
