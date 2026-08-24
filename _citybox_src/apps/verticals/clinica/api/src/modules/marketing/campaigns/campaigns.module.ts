import { Module, forwardRef } from '@nestjs/common';

import { SalesFunnelsModule } from '../../sales/funnels/funnels.module';
import { SalesOpportunitiesModule } from '../../sales/opportunities/opportunities.module';
import { WhatsappModule } from '../../whatsapp/whatsapp.module';

import { CreateCampaignUseCase } from './application/use-cases/create-campaign/create-campaign.use-case';
import { GetCampaignSubmissionUseCase } from './application/use-cases/get-campaign-submission/get-campaign-submission.use-case';
import { GetCampaignUseCase } from './application/use-cases/get-campaign/get-campaign.use-case';
import { GetPublicCampaignUseCase } from './application/use-cases/get-public-campaign/get-public-campaign.use-case';
import { ListCampaignSubmissionsUseCase } from './application/use-cases/list-campaign-submissions/list-campaign-submissions.use-case';
import { ListCampaignTypesUseCase } from './application/use-cases/list-campaign-types/list-campaign-types.use-case';
import { ListCampaignWhatsappMessagesUseCase } from './application/use-cases/list-campaign-whatsapp-messages/list-campaign-whatsapp-messages.use-case';
import { ListCampaignsUseCase } from './application/use-cases/list-campaigns/list-campaigns.use-case';
import { SubmitPublicCampaignUseCase } from './application/use-cases/submit-public-campaign/submit-public-campaign.use-case';
import { TrackPublicCampaignViewUseCase } from './application/use-cases/track-public-campaign-view/track-public-campaign-view.use-case';
import { UpdateCampaignStatusUseCase } from './application/use-cases/update-campaign-status/update-campaign-status.use-case';
import { CampaignRepository } from './domain/repositories/campaign.repository';
import { CampaignSubmissionRepository } from './domain/repositories/campaign-submission.repository';
import { PrismaCampaignRepository } from './infrastructure/database/prisma-campaign.repository';
import { PrismaCampaignSubmissionRepository } from './infrastructure/database/prisma-campaign-submission.repository';
import { CampaignTypesRoute } from './infrastructure/http/routes/campaign-types.route';
import { CampaignsRoute } from './infrastructure/http/routes/campaigns.route';
import { PublicCampaignsRoute } from './infrastructure/http/routes/public-campaigns.route';

@Module({
  imports: [
    SalesFunnelsModule,
    SalesOpportunitiesModule,
    forwardRef(() => WhatsappModule),
  ],
  controllers: [CampaignTypesRoute, CampaignsRoute, PublicCampaignsRoute],
  providers: [
    { provide: CampaignRepository, useClass: PrismaCampaignRepository },
    {
      provide: CampaignSubmissionRepository,
      useClass: PrismaCampaignSubmissionRepository,
    },
    ListCampaignTypesUseCase,
    CreateCampaignUseCase,
    ListCampaignsUseCase,
    GetCampaignUseCase,
    GetCampaignSubmissionUseCase,
    UpdateCampaignStatusUseCase,
    ListCampaignSubmissionsUseCase,
    ListCampaignWhatsappMessagesUseCase,
    GetPublicCampaignUseCase,
    TrackPublicCampaignViewUseCase,
    SubmitPublicCampaignUseCase,
  ],
  exports: [CampaignRepository, CampaignSubmissionRepository],
})
export class CampaignsModule {}
