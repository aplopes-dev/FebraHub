import { ProviderRequestRepository } from '../domain/repositories/provider-request.repository.interface';
import type { ProviderRequest } from '../domain/entities/provider-request.entity';

export class InMemoryProviderRequestRepository extends ProviderRequestRepository {
  private readonly requests: ProviderRequest[] = [];

  save(request: ProviderRequest): Promise<ProviderRequest> {
    this.requests.push(request);
    return Promise.resolve(request);
  }

  findByFiscalDocumentId(fiscalDocumentId: string): Promise<ProviderRequest[]> {
    return Promise.resolve(
      this.requests.filter((r) => r.fiscalDocumentId === fiscalDocumentId),
    );
  }
}
