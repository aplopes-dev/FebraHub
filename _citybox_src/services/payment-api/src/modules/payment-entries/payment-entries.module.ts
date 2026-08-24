import { Module } from '@nestjs/common';
import { PaymentEntriesService } from './payment-entries.service.js';

@Module({
  providers: [PaymentEntriesService],
  exports: [PaymentEntriesService],
})
export class PaymentEntriesModule {}
