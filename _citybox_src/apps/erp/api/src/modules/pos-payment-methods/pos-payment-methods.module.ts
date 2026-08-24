import { Module } from '@nestjs/common';
import { PaymentMethodsModule } from '../finance/payment-methods/payment-methods.module';
import { PosTerminalsModule } from '../pos-terminals/pos-terminals.module';
import { ListPosPaymentMethodsUseCase } from './application/use-cases/list-pos-payment-methods/list-pos-payment-methods.use-case';
import { ListPosPaymentMethodsRoute } from './infrastructure/http/routes/list-pos-payment-methods/list-pos-payment-methods.route';

@Module({
  imports: [PaymentMethodsModule, PosTerminalsModule],
  controllers: [ListPosPaymentMethodsRoute],
  providers: [ListPosPaymentMethodsUseCase],
  exports: [ListPosPaymentMethodsUseCase],
})
export class PosPaymentMethodsModule {}
