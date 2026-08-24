import { Module } from '@nestjs/common';
import { PaymentFeatureFlagsService } from './payment-feature-flags.service.js';

@Module({
  providers: [PaymentFeatureFlagsService],
  exports: [PaymentFeatureFlagsService],
})
export class FeatureFlagsModule {}
