import { Injectable } from '@nestjs/common';
import { PaymentGatewayError } from '../../../domain/errors/payment-gateway.error';

@Injectable()
export class AsaasClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.baseUrl =
      process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';

    if (!this.apiKey) {
      throw new Error('ASAAS_API_KEY environment variable is required');
    }
  }

  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      access_token: this.apiKey,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }

        const asaasErrors = errorData?.errors;
        const internalMessage = asaasErrors
          ? asaasErrors
              .map((e: any) => `[${e.code}] ${e.description}`)
              .join(', ')
          : `HTTP error! status: ${response.status}`;

        const externalMessage =
          asaasErrors && asaasErrors[0]?.description
            ? asaasErrors[0].description
            : 'Erro na integração com gateway de pagamento';

        throw new PaymentGatewayError(
          AsaasClient.name,
          `Asaas API Request failed: ${internalMessage} (Status: ${response.status})`,
          externalMessage,
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof PaymentGatewayError) {
        throw error;
      }
      throw new PaymentGatewayError(
        AsaasClient.name,
        `Network error calling Asaas: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}
