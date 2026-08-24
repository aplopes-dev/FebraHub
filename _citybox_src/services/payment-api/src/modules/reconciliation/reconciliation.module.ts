import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';
import { ReconciliationController } from './reconciliation.controller.js';
import { ReconciliationService } from './reconciliation.service.js';

@Module({
  imports: [AuditModule, WebhooksModule],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
