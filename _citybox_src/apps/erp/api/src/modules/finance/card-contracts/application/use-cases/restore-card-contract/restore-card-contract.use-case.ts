import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { CardContractNotFoundError } from '../../../domain/errors/card-contract-not-found.error';
import type {
  CardContractListItem,
  RestoreCardContractDto,
} from '../../dtos/card-contract.dto';

@Injectable()
export class RestoreCardContractUseCase implements IUseCase<
  RestoreCardContractDto,
  CardContractListItem
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
  ) {}

  async execute(input: RestoreCardContractDto): Promise<CardContractListItem> {
    const existing = await this.cardContractRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!existing) throw new CardContractNotFoundError(input.id);

    // Restaurar quem já está ativo não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — contrato ativo — é o mesmo.
    if (!existing.contract.deletedAt) return existing;

    const restored = existing.contract.restore();
    await this.cardContractRepository.clearDeletedAt(
      input.organizationId,
      input.id,
      restored.updatedAt,
    );

    return {
      contract: restored,
      paymentMethodCount: existing.paymentMethodCount,
    };
  }
}
