import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { CardContractNotFoundError } from '../../../domain/errors/card-contract-not-found.error';
import type {
  CardContractListItem,
  FindCardContractByIdDto,
} from '../../dtos/card-contract.dto';

@Injectable()
export class FindCardContractByIdUseCase implements IUseCase<
  FindCardContractByIdDto,
  CardContractListItem
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
  ) {}

  async execute(input: FindCardContractByIdDto): Promise<CardContractListItem> {
    const item = await this.cardContractRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!item) throw new CardContractNotFoundError(input.id);

    return item;
  }
}
