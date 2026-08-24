import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { CardContractNotFoundError } from '../../../domain/errors/card-contract-not-found.error';
import type { DeleteCardContractDto } from '../../dtos/card-contract.dto';

/**
 * Exclui o contrato de cartão (soft-delete).
 *
 * Nunca apaga: recebíveis conciliados apontam para o contrato, e os relatórios
 * de repasse precisam continuar resolvendo a operadora e as taxas praticadas.
 */
@Injectable()
export class DeleteCardContractUseCase implements IUseCase<
  DeleteCardContractDto,
  void
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
  ) {}

  async execute(input: DeleteCardContractDto): Promise<void> {
    const existing = await this.cardContractRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!existing || existing.contract.deletedAt) {
      throw new CardContractNotFoundError(input.id);
    }

    const deleted = existing.contract.softDelete();
    await this.cardContractRepository.softDelete(
      input.organizationId,
      input.id,
      deleted.deletedAt ?? new Date(),
    );
  }
}
