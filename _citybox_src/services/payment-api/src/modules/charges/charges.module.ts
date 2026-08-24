import { Module } from '@nestjs/common';
import { ProviderAccountsModule } from '../provider-accounts/provider-accounts.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { SplitsModule } from '../splits/splits.module.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';
import { ChargesController } from './charges.controller.js';
import { ChargesService } from './charges.service.js';

@Module({
  imports: [ProvidersModule, ProviderAccountsModule, WebhooksModule, SplitsModule],
  controllers: [ChargesController],
  providers: [ChargesService],
  exports: [ChargesService],
})
export class ChargesModule {}
