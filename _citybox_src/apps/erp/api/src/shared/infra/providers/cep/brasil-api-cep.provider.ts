import { Injectable } from '@nestjs/common';
import {
  type AddressDTO,
  ICepProvider,
} from '../../../domain/providers/cep.provider.interface';
import { CepProviderUnavailableError } from '../../../domain/errors/cep-provider-unavailable.error';

const BRASIL_API_CEP_URL = 'https://brasilapi.com.br/api/cep/v1';
const REQUEST_TIMEOUT_MS = 8_000;

interface BrasilApiCepResponse {
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

@Injectable()
export class BrasilApiCepProvider implements ICepProvider {
  async getAddressByCep(cep: string): Promise<AddressDTO | null> {
    try {
      const response = await fetch(`${BRASIL_API_CEP_URL}/${cep}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new CepProviderUnavailableError(
          BrasilApiCepProvider.name,
          `HTTP ${response.status}`,
        );
      }

      const data = (await response.json()) as BrasilApiCepResponse;

      if (!data.street || !data.neighborhood || !data.city || !data.state) {
        return null;
      }

      return {
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
      };
    } catch (error) {
      if (error instanceof CepProviderUnavailableError) {
        throw error;
      }

      const reason = error instanceof Error ? error.message : 'unknown error';
      throw new CepProviderUnavailableError(BrasilApiCepProvider.name, reason);
    }
  }
}
