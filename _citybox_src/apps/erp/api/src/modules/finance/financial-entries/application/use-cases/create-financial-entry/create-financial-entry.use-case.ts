import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BankAccountRepository } from '../../../../bank-accounts/domain/repositories/bank-account.repository.interface';
import { ChartOfAccountRepository } from '../../../../chart-of-accounts/domain/repositories/chart-of-account.repository.interface';
import { CostCenterRepository } from '../../../../cost-centers/domain/repositories/cost-center.repository.interface';
import { PaymentMethodRepository } from '../../../../payment-methods/domain/repositories/payment-method.repository.interface';
import { CustomerRepository } from '../../../../../customers/domain/repositories/customer.repository.interface';
import { SupplierRepository } from '../../../../../stock/suppliers/domain/repositories/supplier.repository.interface';
import { FinancialEntry } from '../../../domain/entities/financial-entry.entity';
import { FinancialEntryRepository } from '../../../domain/repositories/financial-entry.repository.interface';
import { FinancialEntryPartyConflictError } from '../../../domain/errors/financial-entry-party-conflict.error';
import { assertBankAccountExists } from '../assert-bank-account-exists';
import { assertChartOfAccountExists } from '../assert-chart-of-account-exists';
import { assertCostCenterExists } from '../assert-cost-center-exists';
import { assertCustomerExists } from '../assert-customer-exists';
import { assertPaymentMethodExists } from '../assert-payment-method-exists';
import { assertSupplierExists } from '../assert-supplier-exists';
import type { CreateFinancialEntryDto } from '../../dtos/financial-entry.dto';

@Injectable()
export class CreateFinancialEntryUseCase implements IUseCase<
  CreateFinancialEntryDto,
  FinancialEntry
> {
  constructor(
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly chartOfAccountRepository: ChartOfAccountRepository,
    private readonly costCenterRepository: CostCenterRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async execute(input: CreateFinancialEntryDto): Promise<FinancialEntry> {
    if (input.customerId && input.supplierId) {
      throw new FinancialEntryPartyConflictError();
    }

    const bankAccountId = await assertBankAccountExists(
      this.bankAccountRepository,
      input.organizationId,
      input.bankAccountId,
    );
    const customerId = await assertCustomerExists(
      this.customerRepository,
      input.organizationId,
      input.customerId,
    );
    const supplierId = await assertSupplierExists(
      this.supplierRepository,
      input.organizationId,
      input.supplierId,
    );

    const payments = await Promise.all(
      (input.payments ?? []).map(async (payment) => {
        await assertPaymentMethodExists(
          this.paymentMethodRepository,
          input.organizationId,
          payment.paymentMethod,
        );
        return payment;
      }),
    );

    const allocations = await Promise.all(
      input.allocations.map(async (allocation) => {
        await assertChartOfAccountExists(
          this.chartOfAccountRepository,
          input.organizationId,
          allocation.chartOfAccountId,
        );
        await assertCostCenterExists(
          this.costCenterRepository,
          input.organizationId,
          allocation.costCenterId,
        );
        return allocation;
      }),
    );

    const entry = FinancialEntry.create({
      organizationId: input.organizationId,
      operation: input.operation,
      description: input.description,
      amountCents: input.amountCents,
      feesCents: input.feesCents,
      finesCents: input.finesCents,
      competenceDate: input.competenceDate,
      dueDate: input.dueDate,
      partyName: input.partyName,
      customerId,
      supplierId,
      bankAccountId,
      categoryName: input.categoryName,
      note: input.note,
      payments,
      allocations,
    });

    return this.financialEntryRepository.save(entry);
  }
}
