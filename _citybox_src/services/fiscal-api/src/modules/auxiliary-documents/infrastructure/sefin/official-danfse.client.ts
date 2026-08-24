import { Injectable, Logger } from '@nestjs/common';
import {
  callSefin,
  type SefinResponse,
} from '../../../../shared/infra/fiscal-http/sefin-http-client';

export type OfficialDanfseRequest = {
  accessKey: string;
  privateKeyPem: string;
  certificatePem: string;
};

/// Timeout curto e deliberado.
///
/// O usuário está esperando um PDF na tela (SC-001: 5 segundos no fluxo
/// inteiro). Não dá para gastar esse orçamento aguardando um serviço que, hoje,
/// **nunca** responde: verificado em 2026-08-07 que produção restrita devolve
/// `501`. O caminho local é o real; a chamada oficial é uma tentativa barata.
const OFFICIAL_TIMEOUT_MS = 2_000;

/// Sem retry. Retentar um `501` é gastar o dobro do tempo para receber a mesma
/// resposta — e `501` não é falha transitória, é ausência de implementação.
const NO_RETRY = 0;

/// Cliente do endpoint oficial de DANFSE do Sistema Nacional.
///
/// ⚠️ **Nunca propaga erro.** Devolve `null` em qualquer desfecho que não seja
/// um PDF — 501, timeout, erro de rede, corpo inesperado. É o contrato que
/// sustenta FR-002a: a API oficial é *preferida*, não *necessária*, e a
/// indisponibilidade dela não pode impedir a entrega do documento.
///
/// Se este cliente lançasse, uma instabilidade do órgão derrubaria a impressão
/// de notas que o sistema consegue gerar sozinho.
@Injectable()
export class OfficialDanfseClient {
  private readonly logger = new Logger(OfficialDanfseClient.name);

  async fetch(request: OfficialDanfseRequest): Promise<Buffer | null> {
    const endpoint = process.env.SEFIN_NACIONAL_DANFSE_ENDPOINT;

    // Sem endpoint configurado não há tentativa — e não há erro. Enquanto o
    // órgão não publicar o serviço, esta é a situação normal, não uma falha de
    // configuração a ser alarmada.
    if (!endpoint?.trim()) return null;

    try {
      const response = await callSefin({
        endpoint: `${endpoint.replace(/\/$/, '')}/${request.accessKey}`,
        method: 'GET',
        privateKeyPem: request.privateKeyPem,
        certificatePem: request.certificatePem,
        timeoutMs: OFFICIAL_TIMEOUT_MS,
        maxRetries: NO_RETRY,
      });

      return this.toPdf(response, request.accessKey);
    } catch (error: unknown) {
      // Engolir é o comportamento CORRETO aqui, e só aqui: o chamador tem um
      // caminho alternativo completo. Registrar em `debug` mantém a trilha sem
      // poluir o alarme de erro com uma condição conhecida e estável.
      this.logger.debug(
        `DANFSE oficial indisponivel para ${request.accessKey}; usando geracao local. Causa: ${
          error instanceof Error ? error.message : 'desconhecida'
        }`,
      );
      return null;
    }
  }

  private toPdf(response: SefinResponse, accessKey: string): Buffer | null {
    if (response.statusCode === 501) {
      this.logger.debug(
        `DANFSE oficial respondeu 501 (nao implementado) para ${accessKey}; usando geracao local.`,
      );
      return null;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      this.logger.debug(
        `DANFSE oficial respondeu ${response.statusCode} para ${accessKey}; usando geracao local.`,
      );
      return null;
    }

    const pdf = this.decodePdf(response);

    // Um corpo 200 que não é PDF é mais perigoso que um erro: entregar HTML de
    // portal ou JSON de erro como se fosse documento fiscal produziria um
    // arquivo que não abre — e o operador culparia a nota, não o órgão.
    if (!pdf || pdf.subarray(0, 5).toString() !== '%PDF-') {
      this.logger.debug(
        `DANFSE oficial respondeu 200 sem PDF valido para ${accessKey}; usando geracao local.`,
      );
      return null;
    }

    return pdf;
  }

  /// O Padrão Nacional entrega binário em base64 dentro de JSON, no mesmo
  /// estilo do `nfseXmlGZipB64` da emissão. O corpo cru é aceito como
  /// alternativa caso o serviço passe a devolver o PDF diretamente.
  private decodePdf(response: SefinResponse): Buffer | null {
    const body = response.json;

    if (body && typeof body === 'object') {
      const candidates = ['danfseBase64', 'pdfBase64', 'danfse', 'arquivo'];
      for (const key of candidates) {
        const value = (body as Record<string, unknown>)[key];
        if (typeof value === 'string' && value.length > 0) {
          return Buffer.from(value, 'base64');
        }
      }
      return null;
    }

    return response.rawBody ? Buffer.from(response.rawBody, 'binary') : null;
  }
}
