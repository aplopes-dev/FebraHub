import { Global, Module } from '@nestjs/common';
import { ApiKeyGuard } from '../../common/auth/api-key.guard.js';
import { ApiKeyService } from '../../common/auth/api-key.service.js';

@Global()
@Module({
  providers: [ApiKeyService, ApiKeyGuard],
  exports: [ApiKeyService, ApiKeyGuard],
})
export class AuthModule {}
