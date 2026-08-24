import { Injectable } from '@nestjs/common';
import { gerarPDF } from '@alexssmusica/node-pdf-nfe';
import {
  AuxiliaryDocumentRenderer,
  type RenderInput,
} from '../../domain/renderer.interface';
import { WrongFiscalModelError } from '../../domain/errors/wrong-fiscal-model.error';
import { isContingencyXml, stampContingencyBanner } from './contingency-banner';

/// Modelo do cupom fiscal eletrônico.
const NFCE_MODEL = '65';

/// `<mod>65</mod>` em qualquer namespace/espaçamento.
const MODEL_TAG = /<(?:\w+:)?mod>\s*(\d{2})\s*<\/(?:\w+:)?mod>/;

/// Renderiza a **bobina** do cupom fiscal (DANFE NFC-e) a partir do XML
/// autorizado.
///
/// ⚠️ **Quase todo o trabalho é da biblioteca já adotada, e isso foi
/// verificado, não presumido.** `gerarPDF` despacha por `ide.mod`
/// (`lib/domain/use-cases/pdf/index.js`): modelo 55 vai para `pdfNFe`, e
/// qualquer outro para `pdfNFCe`, cuja página é `[207.5, 1000]` — largura fixa
/// de bobina. Ou seja, passar um XML modelo 65 ao renderizador já existente
/// produz o cupom sem uma linha de leiaute nova.
///
/// A biblioteca também lê `infNFeSupl.qrCode` e `infNFeSupl.urlChave` para
/// desenhar o QR Code e a URL de consulta — o que fecha o circuito com
/// `insertNfceSupplement`.
///
/// **Então por que existe esta classe, se o corpo é quase igual ao
/// `DanfeRenderer`?** Pela guarda abaixo. Sem ela, um documento de modelo 55
/// roteado por engano para cá sairia como DANFE A4 normal, sem erro nenhum: o
/// operador pediria cupom e receberia nota, e nada no sistema registraria o
/// desvio.
@Injectable()
export class DanfeNfceRenderer extends AuxiliaryDocumentRenderer {
  async render(input: RenderInput): Promise<Buffer> {
    const xml = input.authorizedXml.toString('utf-8');

    const model = MODEL_TAG.exec(xml)?.[1];
    if (model !== NFCE_MODEL) {
      throw new WrongFiscalModelError(
        DanfeNfceRenderer.name,
        NFCE_MODEL,
        model,
      );
    }

    const document = await gerarPDF(xml, {
      cancelada: input.isCancelled,
      // Sem isto a biblioteca encerra o documento antes de devolvê-lo e o
      // Buffer sai vazio — mesma razão documentada em `danfe.renderer.ts`.
      notEndDocument: true,
    });

    const pdf = await this.toBuffer(document);

    // FR-011 — a biblioteca não conhece contingência (nada em `pdf-NFCe.js`
    // olha `tpEmis`), então a faixa é carimbada aqui, sobre o PDF pronto.
    return isContingencyXml(xml) ? stampContingencyBanner(pdf) : pdf;
  }

  private toBuffer(document: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
      document.end();
    });
  }
}
