import { Module } from '@nestjs/common';

import { SalesFunnelsModule } from './funnels/funnels.module';
import { SalesLabelsModule } from './labels/labels.module';
import { SalesOpportunitiesModule } from './opportunities/opportunities.module';

@Module({
  imports: [SalesLabelsModule, SalesFunnelsModule, SalesOpportunitiesModule],
})
export class SalesModule {}
