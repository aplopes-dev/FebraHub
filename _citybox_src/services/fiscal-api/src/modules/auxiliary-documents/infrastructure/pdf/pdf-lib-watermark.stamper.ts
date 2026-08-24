import { Injectable } from '@nestjs/common';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { WatermarkStamper } from '../../domain/watermark.interface';

/// Cinza claro. Precisa ser visível o bastante para não passar despercebido
/// (SC-003: distinguível à primeira vista por pessoa não treinada) e claro o
/// bastante para não competir com os dados (FR-005a).
const WATERMARK_GRAY = 0.55;

/// Opacidade baixa é o que preserva a legibilidade em impressão monocromática
/// de baixa qualidade — o cenário do FR-005a.
const WATERMARK_OPACITY = 0.18;

/// Fração da diagonal da página ocupada pelo texto. Cobrir a página inteira é
/// o ponto: uma faixa de cabeçalho sairia com uma tesourada.
const DIAGONAL_COVERAGE = 0.9;

/// Estampagem via `pdf-lib` (research.md R4).
///
/// Trabalha sobre o PDF **pronto**, sem saber quem o produziu — a biblioteca de
/// DANFE, o nosso renderizador de DANFSE, ou a API oficial do Sefin. É o que
/// garante FR-005 nas três fontes com um único caminho de código.
@Injectable()
export class PdfLibWatermarkStamper extends WatermarkStamper {
  async stamp(pdf: Buffer, text: string): Promise<Buffer> {
    const document = await PDFDocument.load(new Uint8Array(pdf));
    const font = await document.embedFont(StandardFonts.HelveticaBold);

    for (const page of document.getPages()) {
      const { width, height } = page.getSize();

      // Ângulo da própria diagonal da página: o texto acompanha o formato em
      // vez de assumir 45°, que sobraria em A4 retrato.
      const angleRadians = Math.atan2(height, width);
      const diagonal = Math.hypot(width, height);

      // Dimensiona a fonte para o texto ocupar a diagonal. Medir em vez de
      // chutar um tamanho fixo é o que faz textos de comprimentos diferentes
      // ("SEM VALOR FISCAL", "AMBIENTE DE TESTE") ficarem igualmente cobertos.
      const widthAtUnitSize = font.widthOfTextAtSize(text, 1);
      const fontSize = (diagonal * DIAGONAL_COVERAGE) / widthAtUnitSize;

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      // Centraliza pelo meio do texto já rotacionado: pdf-lib ancora no canto
      // inferior esquerdo e gira em torno dele, então a compensação precisa ser
      // no eixo rotacionado, não no da página.
      page.drawText(text, {
        x:
          width / 2 -
          (textWidth / 2) * Math.cos(angleRadians) +
          (textHeight / 2) * Math.sin(angleRadians),
        y:
          height / 2 -
          (textWidth / 2) * Math.sin(angleRadians) -
          (textHeight / 2) * Math.cos(angleRadians),
        size: fontSize,
        font,
        color: rgb(WATERMARK_GRAY, WATERMARK_GRAY, WATERMARK_GRAY),
        opacity: WATERMARK_OPACITY,
        rotate: degrees((angleRadians * 180) / Math.PI),
      });
    }

    return Buffer.from(await document.save());
  }
}
