import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { BankAccountLookup } from '../../../domain/repositories/bank-account-lookup.interface';
import { CardContractNotFoundError } from '../../../domain/errors/card-contract-not-found.error';
import { assertBankAccountExists } from '../assert-bank-account-exists';
import { resolveCardContractUpdateInput } from '../resolve-card-contract-input';
import type {
  CardContractListItem,
  UpdateCardContractDto,
} from '../../dtos/card-contract.dto';

@Injectable()
export class UpdateCardContractUseCase implements IUseCase<
  UpdateCardContractDto,
  CardContractListItem
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
    private readonly bankAccountLookup: BankAccountLookup,
  ) {}

  async execute(input: UpdateCardContractDto): Promise<CardContractListItem> {
    const existing = await this.cardContractRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!existing) throw new CardContractNotFoundError(input.id);

    const bankAccountId = await assertBankAccountExists(
      this.bankAccountLookup,
      input.organizationId,
      input.bankAccountId,
    );

    const fields = resolveCardContractUpdateInput(input);
    const updated = existing.contract.update({ ...fields, bankAccountId });
    const saved = await this.cardContractRepository.save(updated);

    return { contract: saved, paymentMethodCount: existing.paymentMethodCount };
  }
}
