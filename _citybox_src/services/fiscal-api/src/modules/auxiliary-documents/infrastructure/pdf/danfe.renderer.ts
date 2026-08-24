import { Injectable } from '@nestjs/common';
import { gerarPDF } from '@alexssmusica/node-pdf-nfe';
import {
  AuxiliaryDocumentRenderer,
  type RenderInput,
} from '../../domain/renderer.interface';

/// Renderiza o DANFE a partir do XML autorizado.
///
/// Adapter sobre `@alexssmusica/node-pdf-nfe` (MIT). A decisão de adotar em vez
/// de implementar está em research.md R2: o leiaute do DANFE é regulado pelo
/// Manual de Orientação ao Contribuinte, existe biblioteca permissiva e
/// mantida que já o implementa, e a assinatura dela — `gerarPDF(xml,
/// { cancelada })` — encaixa em FR-001 e FR-006 sem transformação
/// intermediária nossa que pudesse divergir do que o fisco tem.
///
/// Este adapter existe para que a escolha continue reversível. Se a biblioteca
/// for abandonada, o fallback identificado é `nfe-danfe-pdf` (também MIT) e a
/// troca fica confinada a este arquivo — os testes de `danfe.renderer.spec.ts`
/// validam o PDF, não a biblioteca.
@Injectable()
export class DanfeRenderer extends AuxiliaryDocumentRenderer {
  async render(input: RenderInput): Promise<Buffer> {
    const document = await gerarPDF(input.authorizedXml.toString('utf-8'), {
      cancelada: input.isCancelled,
      // ⚠️ Sem isto a biblioteca encerra o documento antes de devolvê-lo, e os
      // eventos de stream já teriam disparado quando fôssemos escutá-los — o
      // Buffer sairia vazio ou o `end()` estouraria com "write after end".
      // Assumindo o encerramento, controlamos o ciclo inteiro.
      notEndDocument: true,
    });

    return this.toBuffer(document);
  }

  /// A biblioteca devolve um documento PDFKit — um stream ainda aberto.
  /// Acumular em Buffer é o que permite os passos seguintes: a estampagem da
  /// marca d'água precisa do arquivo completo, não de um fluxo.
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
