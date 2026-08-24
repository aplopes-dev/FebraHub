import { SignaturePackageRequest } from '../domain/entities/signature-package-request.entity';
import { SignatureCreditBalance } from '../domain/entities/signature-credit-balance.entity';
import { SignaturePackageRequestRepository } from '../domain/repositories/signature-package-request.repository.interface';
import type { InMemorySignatureCreditBalanceRepository } from './in-memory-signature-credit-balance.repository';

export class InMemorySignaturePackageRequestRepository extends SignaturePackageRequestRepository {
  private items: SignaturePackageRequest[] = [];

  constructor(
    private readonly creditBalanceRepository: InMemorySignatureCreditBalanceRepository,
  ) {
    super();
  }

  findById(
    storeId: string,
    id: string,
  ): Promise<SignaturePackageRequest | null> {
    return Promise.resolve(
      this.items.find((item) => item.id === id && item.storeId === storeId) ??
        null,
    );
  }

  findAllByStoreId(storeId: string): Promise<SignaturePackageRequest[]> {
    return Promise.resolve(
      this.items
        .filter((item) => item.storeId === storeId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    );
  }

  async findPageByStoreId(
    storeId: string,
    params: {
      page: number;
      perPage: number;
      status?: SignaturePackageRequest['status'];
    },
  ): Promise<{ items: SignaturePackageRequest[]; total: number }> {
    const filtered = this.items
      .filter((item) => item.storeId === storeId)
      .filter((item) =>
        params.status ? item.status === params.status : true,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const start = (params.page - 1) * params.perPage;
    const items = filtered.slice(start, start + params.perPage);
    return { items, total };
  }

  save(request: SignaturePackageRequest): Promise<SignaturePackageRequest> {
    const index = this.items.findIndex((item) => item.id === request.id);
    if (index >= 0) {
      this.items = [
        ...this.items.slice(0, index),
        request,
        ...this.items.slice(index + 1),
      ];
    } else {
      this.items = [...this.items, request];
    }
    return Promise.resolve(request);
  }

  async liberateAndCredit(
    request: SignaturePackageRequest,
    balance: SignatureCreditBalance,
  ): Promise<{
    request: SignaturePackageRequest;
    balance: SignatureCreditBalance;
  }> {
    const savedRequest = await this.save(request);
    const savedBalance = await this.creditBalanceRepository.save(balance);
    return { request: savedRequest, balance: savedBalance };
  }

  getAll(): SignaturePackageRequest[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}
