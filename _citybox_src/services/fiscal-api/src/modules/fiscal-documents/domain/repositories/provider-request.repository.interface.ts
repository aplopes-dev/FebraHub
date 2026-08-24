import type { ProviderRequest } from '../entities/provider-request.entity';

export abstract class ProviderRequestRepository {
  abstract save(request: ProviderRequest): Promise<ProviderRequest>;
  abstract findByFiscalDocumentId(
    fiscalDocumentId: string,
  ): Promise<ProviderRequest[]>;
}
