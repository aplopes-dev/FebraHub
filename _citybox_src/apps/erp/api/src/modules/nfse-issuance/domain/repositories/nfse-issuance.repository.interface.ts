import type { NfseIssuance } from '../entities/nfse-issuance.entity';

export abstract class NfseIssuanceRepository {
  /**
   * Busca o vínculo pela chave de idempotência da operação do ERP. É o que
   * impede reemitir a mesma operação (spec erp/018, plan D5/R3).
   */
  abstract findByIdempotency(
    organizationId: string,
    sourceSystem: string,
    externalReference: string,
    idempotencyKey: string,
  ): Promise<NfseIssuance | null>;

  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<NfseIssuance | null>;

  abstract listByOrganization(organizationId: string): Promise<NfseIssuance[]>;

  abstract save(issuance: NfseIssuance): Promise<NfseIssuance>;
}
