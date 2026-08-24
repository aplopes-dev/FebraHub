import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { NfseIssuance } from '../../../domain/entities/nfse-issuance.entity';
import { NfseIssuanceRepository } from '../../../domain/repositories/nfse-issuance.repository.interface';

type Input = { organizationId: string };

/** Lista as NFS-e emitidas pela organização (mais recentes primeiro). */
@Injectable()
export class ListNfseIssuancesUseCase implements IUseCase<
  Input,
  NfseIssuance[]
> {
  constructor(private readonly repository: NfseIssuanceRepository) {}

  execute(input: Input): Promise<NfseIssuance[]> {
    return this.repository.listByOrganization(input.organizationId);
  }
}
