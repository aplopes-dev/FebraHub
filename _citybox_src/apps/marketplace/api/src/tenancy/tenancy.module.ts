import { Global, Module } from '@nestjs/common';
import { TenantResolverService } from './tenant-resolver.service.js';

@Global()
@Module({
  providers: [TenantResolverService],
  exports: [TenantResolverService],
})
export class TenancyModule {}