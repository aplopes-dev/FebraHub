import { Module } from '@nestjs/common';

import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { CostCentersModule } from '../cost-centers/cost-centers.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';

import { BankTransferRepository } from './domain/repositories/bank-transfer.repository.interface';
import { PrismaBankTransferRepository } from './infrastructure/database/prisma-bank-transfer.repository';

import { CreateBankTransferUseCase } from './application/use-cases/create-bank-transfer/create-bank-transfer.use-case';

import { CreateBankTransferRoute } from './infrastructure/http/routes/create-bank-transfer/create-bank-transfer.route';

/**
 * Transferência entre contas bancárias da organização — submódulo fino, só
 * `POST /v1/bank-transfers` (FR-020: sem edição/cancelamento nesta fase).
 * Importa `BankAccountsModule`/`CostCentersModule`/`PaymentMethodsModule` para
 * conferir os 4 vínculos antes de gravar (mesmo padrão de `financial-entries`).
 */
@Module({
  imports: [BankAccountsModule, CostCentersModule, PaymentMethodsModule],
  controllers: [CreateBankTransferRoute],
  providers: [
    { provide: BankTransferRepository, useClass: PrismaBankTransferRepository },
    CreateBankTransferUseCase,
  ],
})
export class BankTransfersModule {}
