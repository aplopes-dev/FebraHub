import { Global, Module } from '@nestjs/common';
import { PaymentLoggerService } from './payment-logger.service.js';
import { PaymentMetricsService } from './payment-metrics.service.js';

@Global()
@Module({
  providers: [PaymentMetricsService, PaymentLoggerService],
  exports: [PaymentMetricsService, PaymentLoggerService],
})
export class ObservabilityModule {}
