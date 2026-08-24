import { Module } from '@nestjs/common';

import { PaymentMethodRepository } from './domain/repositories/payment-method.repository.interface';
import { PrismaPaymentMethodRepository } from './infrastructure/database/prisma-payment-method.repository';

import { CreatePaymentMethodUseCase } from './application/use-cases/create-payment-method/create-payment-method.use-case';
import { ListPaymentMethodsUseCase } from './application/use-cases/list-payment-methods/list-payment-methods.use-case';
import { UpdatePaymentMethodUseCase } from './application/use-cases/update-payment-method/update-payment-method.use-case';
import { DeletePaymentMethodUseCase } from './application/use-cases/delete-payment-method/delete-payment-method.use-case';
import { RestorePaymentMethodUseCase } from './application/use-cases/restore-payment-method/restore-payment-method.use-case';

import { ListPaymentMethodsRoute } from './infrastructure/http/routes/list-payment-methods/list-payment-methods.route';
import { CreatePaymentMethodRoute } from './infrastructure/http/routes/create-payment-method/create-payment-method.route';
import { RestorePaymentMethodRoute } from './infrastructure/http/routes/restore-payment-method/restore-payment-method.route';
import { UpdatePaymentMethodRoute } from './infrastructure/http/routes/update-payment-method/update-payment-method.route';
import { DeletePaymentMethodRoute } from './infrastructure/http/routes/delete-payment-method/delete-payment-method.route';

/**
 * Formas de pagamento da organização — 15 padrão da plataforma (`isSystem`,
 * protegidas contra edição/exclusão) + as que a empresa cadastrar. Fonte
 * única para o select de `financial-entries`/`transfer-dialog`
 * (spec `007-financeiro-ajustes-ui`).
 */
@Module({
  // Ordem importa: as rotas de caminho fixo antes de `:id`, para o Nest não
  // tratar um segmento fixo como parâmetro.
  controllers: [
    ListPaymentMethodsRoute,
    CreatePaymentMethodRoute,
    RestorePaymentMethodRoute,
    UpdatePaymentMethodRoute,
    DeletePaymentMethodRoute,
  ],
  providers: [
    {
      provide: PaymentMethodRepository,
      useClass: PrismaPaymentMethodRepository,
    },
    CreatePaymentMethodUseCase,
    ListPaymentMethodsUseCase,
    UpdatePaymentMethodUseCase,
    DeletePaymentMethodUseCase,
    RestorePaymentMethodUseCase,
  ],
  exports: [PaymentMethodRepository],
})
export class PaymentMethodsModule {}
