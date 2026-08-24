import { Global, Module } from '@nestjs/common';
import { AuditLogService, ProviderRequestService } from './audit.service.js';

@Global()
@Module({
  providers: [AuditLogService, ProviderRequestService],
  exports: [AuditLogService, ProviderRequestService],
})
export class AuditModule {}
