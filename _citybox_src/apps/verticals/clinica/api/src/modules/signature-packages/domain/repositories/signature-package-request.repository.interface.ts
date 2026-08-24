import type { SignatureCreditBalance } from '../entities/signature-credit-balance.entity';
import type {
  SignaturePackageRequest,
  SignaturePackageRequestStatus,
} from '../entities/signature-package-request.entity';

export type ListSignaturePackageRequestsPageParams = {
  page: number;
  perPage: number;
  status?: SignaturePackageRequestStatus;
};

export type ListSignaturePackageRequestsPage = {
  items: SignaturePackageRequest[];
  total: number;
};

export abstract class SignaturePackageRequestRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<SignaturePackageRequest | null>;

  abstract findAllByStoreId(
    storeId: string,
  ): Promise<SignaturePackageRequest[]>;

  abstract findPageByStoreId(
    storeId: string,
    params: ListSignaturePackageRequestsPageParams,
  ): Promise<ListSignaturePackageRequestsPage>;

  abstract save(
    request: SignaturePackageRequest,
  ): Promise<SignaturePackageRequest>;

  /**
   * Marca a solicitação como liberada e soma `quantity` ao saldo, atomicamente.
   */
  abstract liberateAndCredit(
    request: SignaturePackageRequest,
    balance: SignatureCreditBalance,
  ): Promise<{
    request: SignaturePackageRequest;
    balance: SignatureCreditBalance;
  }>;
}
