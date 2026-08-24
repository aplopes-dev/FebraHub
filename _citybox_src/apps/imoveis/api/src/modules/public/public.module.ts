import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { PropertiesModule } from '../properties/properties.module';
import { SettingsModule } from '../settings/settings.module';
import { StorageModule } from '../../shared/infra/storage/storage.module';
import { PublicLeadMailer } from './application/ports/public-lead-mailer.port';
import { GetPublicAgentUseCase } from './application/use-cases/get-public-agent/get-public-agent.use-case';
import { ListPublicAgentListingsUseCase } from './application/use-cases/list-public-agent-listings/list-public-agent-listings.use-case';
import { GetPublicListingUseCase } from './application/use-cases/get-public-listing/get-public-listing.use-case';
import { GetPublicAgentPhotoUseCase } from './application/use-cases/get-public-agent-photo/get-public-agent-photo.use-case';
import { GetPublicListingPhotoUseCase } from './application/use-cases/get-public-listing-photo/get-public-listing-photo.use-case';
import { NotifyPublicLeadUseCase } from './application/use-cases/notify-public-lead/notify-public-lead.use-case';
import { SubmitPublicLeadUseCase } from './application/use-cases/submit-public-lead/submit-public-lead.use-case';
import { ListPublicAgentsUseCase } from './application/use-cases/list-public-agents/list-public-agents.use-case';
import { createPublicLeadMailer } from './infrastructure/mail/create-public-lead-mailer';
import { PublicCatalogRateLimitGuard } from './infrastructure/http/guards/public-catalog-rate-limit.guard';
import { GetPublicAgentRoute } from './infrastructure/http/routes/get-public-agent/get-public-agent.route';
import { ListPublicAgentListingsRoute } from './infrastructure/http/routes/list-public-agent-listings/list-public-agent-listings.route';
import { GetPublicListingRoute } from './infrastructure/http/routes/get-public-listing/get-public-listing.route';
import { GetPublicAgentPhotoRoute } from './infrastructure/http/routes/get-public-agent-photo/get-public-agent-photo.route';
import { GetPublicListingPhotoRoute } from './infrastructure/http/routes/get-public-listing-photo/get-public-listing-photo.route';
import { SubmitPublicLeadRoute } from './infrastructure/http/routes/submit-public-lead/submit-public-lead.route';
import { ListPublicAgentsRoute } from './infrastructure/http/routes/list-public-agents/list-public-agents.route';
import { GlobalPublicAgentRoute } from './infrastructure/http/routes/global-public-agent/global-public-agent.route';
import { GlobalPublicListingRoute } from './infrastructure/http/routes/global-public-listing/global-public-listing.route';
import { GetPublicLeadDocumentRoute } from './infrastructure/http/routes/get-public-lead-document/get-public-lead-document.route';
import { AckPublicLeadDocumentRoute } from './infrastructure/http/routes/ack-public-lead-document/ack-public-lead-document.route';

@Module({
  imports: [SettingsModule, PropertiesModule, StorageModule, LeadsModule],
  controllers: [
    ListPublicAgentsRoute,
    GetPublicAgentRoute,
    ListPublicAgentListingsRoute,
    GetPublicListingRoute,
    GetPublicAgentPhotoRoute,
    GetPublicListingPhotoRoute,
    SubmitPublicLeadRoute,
    GlobalPublicAgentRoute,
    GlobalPublicListingRoute,
    GetPublicLeadDocumentRoute,
    AckPublicLeadDocumentRoute,
  ],
  providers: [
    PublicCatalogRateLimitGuard,
    {
      provide: PublicLeadMailer,
      useFactory: () => createPublicLeadMailer(),
    },
    GetPublicAgentUseCase,
    ListPublicAgentListingsUseCase,
    GetPublicListingUseCase,
    GetPublicAgentPhotoUseCase,
    GetPublicListingPhotoUseCase,
    NotifyPublicLeadUseCase,
    SubmitPublicLeadUseCase,
    ListPublicAgentsUseCase,
  ],
})
export class PublicModule {}
