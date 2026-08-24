import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/// FR-011 — o texto que o documento de contingência precisa exibir.
export const CONTINGENCY_BANNER_TEXT =
  'EMITIDA EM CONTINGENCIA - PENDENTE DE AUTORIZACAO';

const BANNER_HEIGHT = 18;
const FONT_SIZE_MAX = 9;
const SIDE_PADDING = 4;

/// `<tpEmis>9</tpEmis>` em qualquer prefixo de namespace.
const CONTINGENCY_EMISSION = /<(?:\w+:)?tpEmis>\s*9\s*<\/(?:\w+:)?tpEmis>/;

/// O documento foi emitido em contingência offline?
///
/// ⚠️ Lido do **XML autorizado**, não recebido como parâmetro. É o mesmo
/// princípio de FR-008 da feature 004: o documento auxiliar representa a nota
/// como ela foi emitida, e derivar do XML torna impossível imprimir um cupom de
/// contingência sem a marca por esquecimento de passar uma flag.
export function isContingencyXml(xml: string): boolean {
  return CONTINGENCY_EMISSION.test(xml);
}

/// Carimba a faixa de contingência no topo de cada página.
///
/// ⚠️ **Faixa sólida, não marca d'água.** A marca d'água de homologação é clara
/// e diagonal de propósito: ela avisa que o papel não vale nada. Esta faixa diz
/// o contrário — o cupom **vale**, mas ainda não foi autorizado. O consumidor
/// precisa ler isso, não notar de relance.
///
/// No topo porque a bobina é cortada por baixo: uma faixa no rodapé sairia com
/// a tesourada.
///
/// Aplicada aqui, sobre o PDF pronto, e não dentro dos renderizadores: a bobina
/// vem de biblioteca de terceiro que não conhece contingência, e duplicar a
/// regra nos dois leiautes deixaria as duas livres para divergir.
export async function stampContingencyBanner(pdf: Buffer): Promise<Buffer> {
  const document = await PDFDocument.load(new Uint8Array(pdf));
  const font = await document.embedFont(StandardFonts.HelveticaBold);

  for (const page of document.getPages()) {
    const { width, height } = page.getSize();

    // A bobina tem ~207pt de largura e o A4 ~595. Um corpo fixo estouraria
    // numa e ficaria minúsculo na outra, então a fonte é ajustada à página.
    const available = width - SIDE_PADDING * 2;
    let size = FONT_SIZE_MAX;
    while (
      size > 4 &&
      font.widthOfTextAtSize(CONTINGENCY_BANNER_TEXT, size) > available
    ) {
      size -= 0.5;
    }

    const textWidth = font.widthOfTextAtSize(CONTINGENCY_BANNER_TEXT, size);

    page.drawRectangle({
      x: 0,
      y: height - BANNER_HEIGHT,
      width,
      height: BANNER_HEIGHT,
      color: rgb(0, 0, 0),
    });

    page.drawText(CONTINGENCY_BANNER_TEXT, {
      x: (width - textWidth) / 2,
      y: height - BANNER_HEIGHT + (BANNER_HEIGHT - size) / 2 + 1,
      size,
      font,
      // Branco sobre preto: impressora térmica não tem escala de cinza
      // confiável, e um cinza sobre cinza sumiria no papel de bobina.
      color: rgb(1, 1, 1),
    });
  }

  return Buffer.from(await document.save());
}
