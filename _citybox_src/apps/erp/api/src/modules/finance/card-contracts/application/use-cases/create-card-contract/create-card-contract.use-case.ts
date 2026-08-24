import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { CardContract } from '../../../domain/entities/card-contract.entity';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import { BankAccountLookup } from '../../../domain/repositories/bank-account-lookup.interface';
import { assertBankAccountExists } from '../assert-bank-account-exists';
import type {
  CardContractListItem,
  CreateCardContractDto,
} from '../../dtos/card-contract.dto';

@Injectable()
export class CreateCardContractUseCase implements IUseCase<
  CreateCardContractDto,
  CardContractListItem
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
    private readonly bankAccountLookup: BankAccountLookup,
  ) {}

  async execute(input: CreateCardContractDto): Promise<CardContractListItem> {
    const bankAccountId = await assertBankAccountExists(
      this.bankAccountLookup,
      input.organizationId,
      input.bankAccountId,
    );

    const contract = CardContract.create({
      organizationId: input.organizationId,
      provider: input.provider,
      bankAccountId,
      description: input.description,
      grouping: input.grouping,
      cutoffPeriod: input.cutoffPeriod,
      firstPaymentDayType: input.firstPaymentDayType,
      installmentDayType: input.installmentDayType,
      businessDaysOnly: input.businessDaysOnly,
      depositFeeCents: input.depositFeeCents,
      anticipationPeriods: input.anticipationPeriods,
      anticipationRate: input.anticipationRate,
      allEntriesPaidInContract: input.allEntriesPaidInContract,
      businessDaysDeposit: input.businessDaysDeposit,
      active: input.active,
    });

    const saved = await this.cardContractRepository.save(contract);

    // Contrato recém-criado não tem forma de pagamento: elas entram depois, por
    // `POST /v1/card-contracts/:contractId/payment-methods`.
    return { contract: saved, paymentMethodCount: 0 };
  }
}
