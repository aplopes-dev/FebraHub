/// Tipagem local para `svg-to-pdfkit`, que não publica `.d.ts`.
///
/// Escrita à mão em vez de `@ts-ignore` no ponto de uso: a Constituição proíbe
/// silenciar o compilador, e uma declaração honesta documenta a API de fato
/// usada — `SVGtoPDF(doc, svg, x, y, options)`.
declare module 'svg-to-pdfkit' {
  type SvgToPdfOptions = {
    width?: number;
    height?: number;
    preserveAspectRatio?: string;
    /// Cor usada quando o SVG declara `currentColor`.
    colorCallback?: (color: number[] | null) => [number[], number];
    assumePt?: boolean;
  };

  function SVGtoPDF(
    doc: PDFKit.PDFDocument,
    svg: string,
    x?: number,
    y?: number,
    options?: SvgToPdfOptions,
  ): void;

  export = SVGtoPDF;
}
