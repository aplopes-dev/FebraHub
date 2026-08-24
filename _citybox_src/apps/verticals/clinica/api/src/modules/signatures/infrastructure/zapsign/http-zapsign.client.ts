import { Injectable, Logger } from '@nestjs/common';
import {
  ZapSignClient,
  type ZapSignCreateDocumentInput,
  type ZapSignDocumentResponse,
  type ZapSignSignerResponse,
} from '../../domain/zapsign/zapsign-client.interface';
import { ZapSignUnavailableError } from '../../domain/errors/zapsign-unavailable.error';

type ZapSignApiSigner = {
  token?: string;
  status?: string;
  name?: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
  sign_url?: string;
  signed_at?: string | null;
};

type ZapSignApiDoc = {
  token?: string;
  status?: string;
  name?: string;
  original_file?: string | null;
  signed_file?: string | null;
  signers?: ZapSignApiSigner[];
};

@Injectable()
export class HttpZapSignClient extends ZapSignClient {
  private readonly logger = new Logger(HttpZapSignClient.name);

  private get baseUrl(): string {
    return (
      process.env.ZAPSIGN_BASE_URL?.trim().replace(/\/$/, '') ||
      'https://api.zapsign.com.br'
    );
  }

  private get token(): string {
    const value = process.env.ZAPSIGN_API_TOKEN?.trim();
    if (!value) {
      throw new ZapSignUnavailableError(
        this.constructor.name,
        'ZAPSIGN_API_TOKEN não configurado',
      );
    }
    return value;
  }

  async createDocument(
    input: ZapSignCreateDocumentInput,
  ): Promise<ZapSignDocumentResponse> {
    const body = {
      name: input.name,
      base64_pdf: input.base64Pdf,
      external_id: input.externalId,
      lang: input.lang ?? 'pt-br',
      signature_order_active: input.signatureOrderActive ?? false,
      signers: input.signers.map((signer) => ({
        name: signer.name,
        email: signer.email ?? '',
        phone_country: signer.phoneCountry ?? '55',
        phone_number: signer.phoneNumber ?? '',
        auth_mode: signer.authMode ?? 'assinaturaTela',
        send_automatic_email: signer.sendAutomaticEmail ?? false,
        send_automatic_whatsapp: signer.sendAutomaticWhatsapp ?? false,
      })),
    };

    const raw = await this.requestJson<ZapSignApiDoc>('POST', '/api/v1/docs/', body);
    return this.mapDocument(raw);
  }

  async getDocument(token: string): Promise<ZapSignDocumentResponse> {
    const raw = await this.requestJson<ZapSignApiDoc>(
      'GET',
      `/api/v1/docs/${encodeURIComponent(token)}/`,
    );
    return this.mapDocument(raw);
  }

  async downloadSignedPdf(signedFileUrl: string): Promise<Buffer> {
    try {
      this.assertAllowedSignedFileUrl(signedFileUrl);
      const response = await fetch(signedFileUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error instanceof ZapSignUnavailableError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`downloadSignedPdf failed: ${message}`);
      throw new ZapSignUnavailableError(this.constructor.name, message);
    }
  }

  private assertAllowedSignedFileUrl(signedFileUrl: string): void {
    let parsed: URL;
    try {
      parsed = new URL(signedFileUrl);
    } catch {
      throw new ZapSignUnavailableError(
        this.constructor.name,
        'URL de PDF assinado inválida',
      );
    }

    if (parsed.protocol !== 'https:') {
      throw new ZapSignUnavailableError(
        this.constructor.name,
        'URL de PDF assinado deve usar HTTPS',
      );
    }

    const host = parsed.hostname.toLowerCase();
    const allowed =
      host === 'api.zapsign.com.br' ||
      host === 'sandbox.api.zapsign.com.br' ||
      host.endsWith('.zapsign.com.br') ||
      host === 'zapsign.com.br' ||
      host === 'zapsign.s3.amazonaws.com' ||
      /^zapsign\.s3[.-][a-z0-9-]+\.amazonaws\.com$/.test(host);

    if (!allowed) {
      throw new ZapSignUnavailableError(
        this.constructor.name,
        'URL de PDF assinado fora do domínio permitido',
      );
    }
  }

  async cancelDocument(token: string): Promise<void> {
    await this.requestJson<unknown>(
      'POST',
      `/api/v1/docs/${encodeURIComponent(token)}/cancel/`,
      {},
    );
  }

  private async requestJson<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ZapSignUnavailableError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`ZapSign ${method} ${path} failed: ${message}`);
      throw new ZapSignUnavailableError(this.constructor.name, message);
    }
  }

  private mapDocument(raw: ZapSignApiDoc): ZapSignDocumentResponse {
    if (!raw.token) {
      throw new ZapSignUnavailableError(
        this.constructor.name,
        'Resposta ZapSign sem token de documento',
      );
    }

    return {
      token: raw.token,
      status: raw.status ?? 'pending',
      name: raw.name ?? '',
      originalFile: raw.original_file ?? null,
      signedFile: raw.signed_file ?? null,
      signers: (raw.signers ?? []).map((signer) => this.mapSigner(signer)),
    };
  }

  private mapSigner(raw: ZapSignApiSigner): ZapSignSignerResponse {
    return {
      token: raw.token ?? '',
      status: raw.status ?? 'new',
      name: raw.name ?? '',
      email: raw.email ?? '',
      phoneCountry: raw.phone_country ?? '',
      phoneNumber: raw.phone_number ?? '',
      signUrl: raw.sign_url ?? '',
      signedAt: raw.signed_at?.trim() || null,
    };
  }
}
