import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  AuxiliaryDocumentRenderer,
  type RenderInput,
} from '../../domain/renderer.interface';
import { readNfceXml, type NfceDocumentData } from './nfce-xml.reader';
import { formatAccessKey, renderVerificationQrCode } from './barcode';
import { isContingencyXml, stampContingencyBanner } from './contingency-banner';

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4 retrato, em pontos
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const QR_SIZE = 96;

/// Descrição de item exibida em homologação.
///
/// ⚠️ **Existe para as duas vias dizerem a mesma coisa.** A biblioteca que gera
/// a bobina já mascara `xProd` quando `tpAmb !== '1'` (`pdf-NFCe.js:176`),
/// implementando a regra da SEFAZ. Sem espelhar aqui, o A4 mostraria a
/// descrição real e a bobina não — divergência entre duas vias do MESMO cupom,
/// que é exatamente o defeito que SC-007 proíbe.
///
/// A bobina trunca para caber na largura dela; o A4 tem espaço para o texto
/// inteiro, então a comparação entre as vias usa o prefixo comum.
const HOMOLOGATION_ITEM_DESCRIPTION =
  'NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL';

/// Documento auxiliar do cupom em **A4** (FR-007a).
///
/// **Por que existe, se a bobina já sai da biblioteca**: a bobina é papel de
/// balcão — some, desbota e não se anexa a e-mail. O A4 é a via que o
/// consumidor guarda, reenvia e imprime em impressora comum. O usuário pediu
/// os dois formatos explicitamente, contra a minha recomendação de adiar o A4;
/// a decisão é dele e está entregue.
///
/// ⚠️ **Leiaute diferente, fatos idênticos.** Esta é a única regra que não pode
/// ser relaxada: o A4 pode organizar a página como quiser, mas chave,
/// protocolo, itens, totais e pagamentos têm de bater com a bobina. Duas vias
/// do mesmo documento fiscal dizendo coisas diferentes é defeito, e há teste
/// comparando o conteúdo das duas (SC-007).
///
/// Implementação própria com pdfkit, como o `DanfseRenderer` — não há
/// biblioteca para o A4 de cupom, porque o formato não é regulado: o leiaute
/// oficial da NFC-e é a bobina.
@Injectable()
export class DanfceA4Renderer extends AuxiliaryDocumentRenderer {
  async render(input: RenderInput): Promise<Buffer> {
    const data = readNfceXml(input.authorizedXml);

    // Imagem gerada antes de abrir o documento: pdfkit desenha de forma
    // síncrona, e um `await` no meio embaralharia a ordem dos elementos.
    const qrCode = await renderVerificationQrCode(data.qrCode);

    const doc = new PDFDocument({
      size: 'A4',
      margin: MARGIN,
      info: {
        Title: `DANFCE ${data.accessKey}`,
        Author: data.emitter.legalName,
      },
    });

    const chunks: Buffer[] = [];
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.drawHeader(doc, data);
    this.drawStatus(doc, input);
    this.drawConsumer(doc, data);
    this.drawItems(doc, data);
    this.drawTotals(doc, data);
    this.drawPayments(doc, data);
    this.drawAuthorization(doc, data, qrCode);

    doc.end();
    const pdf = await done;

    // FR-011 — mesmo carimbo da bobina, pelo mesmo código. Desenhar a faixa
    // aqui dentro com pdfkit produziria duas implementações da mesma regra,
    // livres para divergir no texto ou na posição.
    return isContingencyXml(input.authorizedXml.toString('utf-8'))
      ? stampContingencyBanner(pdf)
      : pdf;
  }

  private drawHeader(doc: PDFKit.PDFDocument, data: NfceDocumentData): void {
    doc.fontSize(13).font('Helvetica-Bold');
    doc.text(data.emitter.tradeName || data.emitter.legalName, {
      width: CONTENT_WIDTH,
    });

    doc.fontSize(8).font('Helvetica');
    doc.text(data.emitter.legalName, { width: CONTENT_WIDTH });
    doc.text(`CNPJ ${data.emitter.cnpj}`, { width: CONTENT_WIDTH });
    doc.text(data.emitter.address, { width: CONTENT_WIDTH });

    doc.moveDown(0.6);
    doc.fontSize(11).font('Helvetica-Bold');
    // Diz o que é: quem recebe o A4 precisa saber que é cupom, não nota.
    doc.text(
      'DANFE NFC-e — Documento Auxiliar da Nota Fiscal de Consumidor Eletronica',
      { width: CONTENT_WIDTH },
    );

    doc.fontSize(9).font('Helvetica');
    doc.text(
      `NFC-e no ${data.number} · Serie ${data.series} · Emissao ${data.emittedAt}`,
      { width: CONTENT_WIDTH },
    );
    doc.moveDown(0.5);
  }

  /// Faixa de estado. Só aparece quando há o que dizer — uma faixa "AUTORIZADO"
  /// em toda via treinaria o olho a ignorá-la, e a de cancelamento passaria
  /// despercebida junto.
  private drawStatus(doc: PDFKit.PDFDocument, input: RenderInput): void {
    if (input.substitutedBy) {
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(`CUPOM SUBSTITUIDO PELO DOCUMENTO ${input.substitutedBy}`, {
        width: CONTENT_WIDTH,
      });
      doc.moveDown(0.4);
      return;
    }

    if (input.isCancelled) {
      doc.fontSize(13).font('Helvetica-Bold');
      doc.text('CUPOM CANCELADO', { width: CONTENT_WIDTH });
      doc.moveDown(0.4);
    }
  }

  private drawConsumer(doc: PDFKit.PDFDocument, data: NfceDocumentData): void {
    doc.fontSize(9).font('Helvetica-Bold').text('CONSUMIDOR');
    doc.fontSize(9).font('Helvetica');
    doc.text(
      data.consumer
        ? `${data.consumer.document}${data.consumer.name ? ` — ${data.consumer.name}` : ''}`
        : // Explícito, não em branco: campo vazio parece dado faltando, e a
          // ausência de identificação é situação normal e legítima no balcão.
          'CONSUMIDOR NAO IDENTIFICADO',
      { width: CONTENT_WIDTH },
    );
    doc.moveDown(0.6);
  }

  private drawItems(doc: PDFKit.PDFDocument, data: NfceDocumentData): void {
    doc.fontSize(9).font('Helvetica-Bold').text('ITENS');
    doc.moveDown(0.2);

    for (const item of data.items) {
      const description = data.isHomologation
        ? HOMOLOGATION_ITEM_DESCRIPTION
        : item.description;

      doc.fontSize(9).font('Helvetica-Bold');
      doc.text(`${item.code} ${description}`, { width: CONTENT_WIDTH });
      doc.fontSize(8).font('Helvetica');
      doc.text(
        `${item.quantity} ${item.unit} x ${item.unitValue} = ${item.totalValue}`,
        { width: CONTENT_WIDTH },
      );
      doc.moveDown(0.2);
    }
    doc.moveDown(0.4);
  }

  private drawTotals(doc: PDFKit.PDFDocument, data: NfceDocumentData): void {
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`QTD. TOTAL DE ITENS: ${data.items.length}`, {
      width: CONTENT_WIDTH,
    });
    doc.text(`VALOR TOTAL: ${data.totalAmount}`, { width: CONTENT_WIDTH });
    doc.moveDown(0.5);
  }

  private drawPayments(doc: PDFKit.PDFDocument, data: NfceDocumentData): void {
    doc.fontSize(9).font('Helvetica-Bold').text('FORMA DE PAGAMENTO');
    doc.fontSize(9).font('Helvetica');

    for (const payment of data.payments) {
      doc.text(`${payment.method}: ${payment.amount}`, {
        width: CONTENT_WIDTH,
      });
    }
    doc.text(`TROCO: ${data.changeAmount}`, { width: CONTENT_WIDTH });
    doc.moveDown(0.6);
  }

  private drawAuthorization(
    doc: PDFKit.PDFDocument,
    data: NfceDocumentData,
    qrCode: Buffer,
  ): void {
    doc.fontSize(9).font('Helvetica-Bold').text('CHAVE DE ACESSO');
    doc.fontSize(9).font('Helvetica');
    // Agrupada de 4 em 4: 44 dígitos corridos são impossíveis de conferir ou
    // digitar sem erro.
    doc.text(formatAccessKey(data.accessKey), { width: CONTENT_WIDTH });
    doc.moveDown(0.3);

    doc.text(`Consulte em: ${data.urlChave}`, { width: CONTENT_WIDTH });
    doc.text(`Protocolo de autorizacao: ${data.protocol}`, {
      width: CONTENT_WIDTH,
    });
    doc.text(`Data de autorizacao: ${data.authorizedAt}`, {
      width: CONTENT_WIDTH,
    });
    doc.moveDown(0.5);

    // O mesmo conteúdo de `infNFeSupl/qrCode` que vai na bobina: as duas vias
    // levam à mesma consulta.
    doc.image(qrCode, doc.x, doc.y, { width: QR_SIZE, height: QR_SIZE });
    doc.moveDown(0.5);
  }
}
