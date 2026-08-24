import { Module } from '@nestjs/common';

import { CardContractRepository } from './domain/repositories/card-contract.repository.interface';
import { CardPaymentMethodRepository } from './domain/repositories/card-payment-method.repository.interface';
import { BankAccountLookup } from './domain/repositories/bank-account-lookup.interface';
import { PrismaCardContractRepository } from './infrastructure/database/prisma-card-contract.repository';
import { PrismaCardPaymentMethodRepository } from './infrastructure/database/prisma-card-payment-method.repository';
import { PrismaBankAccountLookup } from './infrastructure/database/prisma-bank-account-lookup';

import { CreateCardContractUseCase } from './application/use-cases/create-card-contract/create-card-contract.use-case';
import { ListCardContractsUseCase } from './application/use-cases/list-card-contracts/list-card-contracts.use-case';
import { FindCardContractByIdUseCase } from './application/use-cases/find-card-contract-by-id/find-card-contract-by-id.use-case';
import { UpdateCardContractUseCase } from './application/use-cases/update-card-contract/update-card-contract.use-case';
import { DeleteCardContractUseCase } from './application/use-cases/delete-card-contract/delete-card-contract.use-case';
import { RestoreCardContractUseCase } from './application/use-cases/restore-card-contract/restore-card-contract.use-case';
import { ListPaymentMethodsUseCase } from './application/use-cases/list-payment-methods/list-payment-methods.use-case';
import { CreatePaymentMethodUseCase } from './application/use-cases/create-payment-method/create-payment-method.use-case';
import { UpdatePaymentMethodUseCase } from './application/use-cases/update-payment-method/update-payment-method.use-case';
import { DeletePaymentMethodUseCase } from './application/use-cases/delete-payment-method/delete-payment-method.use-case';

import { ListCardContractsRoute } from './infrastructure/http/routes/list-card-contracts/list-card-contracts.route';
import { CreateCardContractRoute } from './infrastructure/http/routes/create-card-contract/create-card-contract.route';
import { RestoreCardContractRoute } from './infrastructure/http/routes/restore-card-contract/restore-card-contract.route';
import { ListPaymentMethodsRoute } from './infrastructure/http/routes/list-payment-methods/list-payment-methods.route';
import { CreatePaymentMethodRoute } from './infrastructure/http/routes/create-payment-method/create-payment-method.route';
import { UpdatePaymentMethodRoute } from './infrastructure/http/routes/update-payment-method/update-payment-method.route';
import { DeletePaymentMethodRoute } from './infrastructure/http/routes/delete-payment-method/delete-payment-method.route';
import { FindCardContractByIdRoute } from './infrastructure/http/routes/find-card-contract-by-id/find-card-contract-by-id.route';
import { UpdateCardContractRoute } from './infrastructure/http/routes/update-card-contract/update-card-contract.route';
import { DeleteCardContractRoute } from './infrastructure/http/routes/delete-card-contract/delete-card-contract.route';

/**
 * Contratos de cartão da organização, com as formas de pagamento aceitas em cada
 * um como agregado aninhado (`/v1/card-contracts/:contractId/payment-methods`).
 *
 * A conta bancária de destino é conferida por uma porta local
 * (`BankAccountLookup`), não pelo módulo `bank-accounts` — ver a interface.
 */
@Module({
  // Ordem importa: as rotas de caminho fixo e as aninhadas antes de `:id`, para
  // o Nest não tratar um segmento fixo como parâmetro.
  controllers: [
    ListCardContractsRoute,
    CreateCardContractRoute,
    RestoreCardContractRoute,
    ListPaymentMethodsRoute,
    CreatePaymentMethodRoute,
    UpdatePaymentMethodRoute,
    DeletePaymentMethodRoute,
    FindCardContractByIdRoute,
    UpdateCardContractRoute,
    DeleteCardContractRoute,
  ],
  providers: [
    { provide: CardContractRepository, useClass: PrismaCardContractRepository },
    {
      provide: CardPaymentMethodRepository,
      useClass: PrismaCardPaymentMethodRepository,
    },
    { provide: BankAccountLookup, useClass: PrismaBankAccountLookup },
    CreateCardContractUseCase,
    ListCardContractsUseCase,
    FindCardContractByIdUseCase,
    UpdateCardContractUseCase,
    DeleteCardContractUseCase,
    RestoreCardContractUseCase,
    ListPaymentMethodsUseCase,
    CreatePaymentMethodUseCase,
    UpdatePaymentMethodUseCase,
    DeletePaymentMethodUseCase,
  ],
  exports: [CardContractRepository, CardPaymentMethodRepository],
})
export class CardContractsModule {}
