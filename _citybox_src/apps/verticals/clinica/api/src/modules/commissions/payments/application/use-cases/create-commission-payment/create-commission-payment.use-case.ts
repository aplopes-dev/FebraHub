import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialAccountRepository } from '../../../../../financial/accounts/domain/repositories/financial-account.repository.interface';
import { FinancialAccountNotFoundError } from '../../../../../financial/accounts/domain/errors/financial-account-not-found.error';
import { FinancialEntry } from '../../../../../financial/entries/domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../../../financial/entries/domain/repositories/financial-entry.repository.interface';
import { CommissionAccrualRepository } from '../../../../accruals/domain/repositories/commission-accrual.repository.interface';
import { CommissionAccrualAlreadyPaidError } from '../../../../accruals/domain/errors/commission-accrual-already-paid.error';
import { CommissionPayment } from '../../../domain/entities/commission-payment.entity';
import { CommissionPaymentRepository } from '../../../domain/repositories/commission-payment.repository.interface';
import { CommissionPaymentAccrualsMismatchError } from '../../../domain/errors/commission-payment-accruals-mismatch.error';
import { CommissionPaymentZodValidator } from '../../../domain/validators/commission-payment.validator';
import { parseIsoDateOnly } from '../../../../shared/domain/commission-date.utils';
import type { CreateCommissionPaymentDto } from '../../dtos/commission-payment.dto';

@Injectable()
export class CreateCommissionPaymentUseCase
  implements IUseCase<CreateCommissionPaymentDto, CommissionPayment>
{
  private readonly validator = CommissionPaymentZodValidator.create();

  constructor(
    private readonly accrualRepository: CommissionAccrualRepository,
    private readonly paymentRepository: CommissionPaymentRepository,
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly financialAccountRepository: FinancialAccountRepository,
  ) {}

  async execute(dto: CreateCommissionPaymentDto): Promise<CommissionPayment> {
    const validated = this.validator.validate({
      memberId: dto.memberId,
      accrualIds: dto.accrualIds,
      description: dto.description,
      paymentDate: dto.paymentDate,
      accountId: dto.accountId,
      paymentMethod: dto.paymentMethod,
      discountCents: dto.discountCents,
      observation: dto.observation,
    });

    const account = await this.financialAccountRepository.findById(
      dto.storeId,
      validated.accountId,
    );
    if (!account) {
      throw new FinancialAccountNotFoundError(
        CreateCommissionPaymentUseCase.name,
        validated.accountId,
      );
    }

    const uniqueIds = [...new Set(validated.accrualIds)];
    const accruals = await this.accrualRepository.findManyByIds(
      dto.storeId,
      validated.memberId,
      uniqueIds,
    );

    if (accruals.length !== uniqueIds.length) {
      throw new CommissionPaymentAccrualsMismatchError(
        CreateCommissionPaymentUseCase.name,
      );
    }

    for (const accrual of accruals) {
      if (accrual.status !== 'open') {
        throw new CommissionAccrualAlreadyPaidError(
          CreateCommissionPaymentUseCase.name,
          accrual.id,
        );
      }
    }

    const grossCents = accruals.reduce(
      (sum, accrual) => sum + accrual.commissionCents,
      0,
    );
    const discountCents = validated.discountCents ?? 0;
    const netCents = Math.max(0, grossCents - discountCents);
    const paymentDate = parseIsoDateOnly(validated.paymentDate);
    const memberName = accruals[0]!.memberName;

    const expense = await this.financialEntryRepository.save(
      FinancialEntry.create({
        storeId: dto.storeId,
        type: 'expense',
        source: 'manual',
        status: 'paid',
        description: validated.description.trim(),
        valueCents: netCents,
        dueDate: paymentDate,
        paidAt: paymentDate,
        paidValueCents: netCents,
        paymentMethod: validated.paymentMethod,
        accountId: validated.accountId,
        observation: validated.observation?.trim() || null,
        receiveDetail: {
          paymentMethod: validated.paymentMethod,
          accountId: validated.accountId,
          paidValueCents: netCents,
        },
      }),
    );

    const payment = CommissionPayment.create({
      storeId: dto.storeId,
      memberId: validated.memberId,
      memberName,
      description: validated.description.trim(),
      paymentDate,
      accountId: validated.accountId,
      paymentMethod: validated.paymentMethod,
      grossCents,
      discountCents,
      netCents,
      observation: validated.observation?.trim() || null,
      expenseEntryId: expense.id,
      accrualIds: uniqueIds,
    });

    const saved = await this.paymentRepository.saveWithItems(
      payment,
      uniqueIds,
    );
    return saved;
  }
}
