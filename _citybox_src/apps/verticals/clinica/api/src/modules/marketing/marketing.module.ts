import { Module } from '@nestjs/common';

import { CampaignsModule } from './campaigns/campaigns.module';
import { IndicacoesModule } from './indicacoes/indicacoes.module';

@Module({
  imports: [CampaignsModule, IndicacoesModule],
})
export class MarketingModule {}
