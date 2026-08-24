import { Provider } from '@nestjs/common';
import { PAYMENT_GATEWAY } from '../../domain/providers/payment-gateway.interface';
import { AsaasGateway } from '../providers/asaas/asaas.gateway';

export const PaymentGatewayProvider: Provider = {
  provide: PAYMENT_GATEWAY,
  useClass: AsaasGateway,
};
