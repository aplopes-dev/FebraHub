import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { PropertiesModule } from '../properties/properties.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DealsModule } from '../deals/deals.module';
import { GoogleCalendarModule } from '../google-calendar/google-calendar.module';
import { LeadRepository } from './domain/repositories/lead.repository.interface';
import { PrismaLeadRepository } from './infrastructure/database/prisma-lead.repository';
import { ListLeadsRoute } from './infrastructure/http/routes/list-leads/list-leads.route';
import { GetLeadByIdRoute } from './infrastructure/http/routes/get-lead-by-id/get-lead-by-id.route';
import { CreateLeadRoute } from './infrastructure/http/routes/create-lead/create-lead.route';
import { BatchCreateLeadsRoute } from './infrastructure/http/routes/batch-create-leads/batch-create-leads.route';
import { UpdateLeadRoute } from './infrastructure/http/routes/update-lead/update-lead.route';
import { UpdateLeadStatusRoute } from './infrastructure/http/routes/update-lead-status/update-lead-status.route';
import { DeleteLeadRoute } from './infrastructure/http/routes/delete-lead/delete-lead.route';
import { SyncAgentCatalogLeadsRoute } from './infrastructure/http/routes/sync-agent-catalog-leads/sync-agent-catalog-leads.route';
import { SendLeadDocumentWhatsAppRoute } from './infrastructure/http/routes/send-lead-document-whatsapp/send-lead-document-whatsapp.route';
import { GetLeadDocumentRoute } from './infrastructure/http/routes/get-lead-document/get-lead-document.route';
import { UploadLeadDocumentRoute } from './infrastructure/http/routes/upload-lead-document/upload-lead-document.route';
import { ListLeadsUseCase } from './application/use-cases/list-leads/list-leads.use-case';
import { GetLeadByIdUseCase } from './application/use-cases/get-lead-by-id/get-lead-by-id.use-case';
import { CreateLeadUseCase } from './application/use-cases/create-lead/create-lead.use-case';
import { BatchCreateLeadsUseCase } from './application/use-cases/batch-create-leads/batch-create-leads.use-case';
import { UpdateLeadUseCase } from './application/use-cases/update-lead/update-lead.use-case';
import { UpdateLeadStatusUseCase } from './application/use-cases/update-lead-status/update-lead-status.use-case';
import { DeleteLeadUseCase } from './application/use-cases/delete-lead/delete-lead.use-case';
import { SyncAgentCatalogLeadsUseCase } from './application/use-cases/sync-agent-catalog-leads/sync-agent-catalog-leads.use-case';
import { GetLeadDocumentUseCase } from './application/use-cases/get-lead-document/get-lead-document.use-case';
import { GetPublicLeadDocumentUseCase } from './application/use-cases/get-public-lead-document/get-public-lead-document.use-case';
import { AckPublicLeadDocumentUseCase } from './application/use-cases/ack-public-lead-document/ack-public-lead-document.use-case';
import { SendLeadDocumentWhatsAppUseCase } from './application/use-cases/send-lead-document-whatsapp/send-lead-document-whatsapp.use-case';
import { UploadLeadDocumentUseCase } from './application/use-cases/upload-lead-document/upload-lead-document.use-case';

@Module({
  imports: [
    PrismaModule,
    AppointmentsModule,
    GoogleCalendarModule,
    PropertiesModule,
    forwardRef(() => DealsModule),
  ],
  controllers: [
    ListLeadsRoute,
    GetLeadByIdRoute,
    // `batch` antes de rotas com :id implícitas — controller separado só em POST batch
    BatchCreateLeadsRoute,
    CreateLeadRoute,
    UpdateLeadRoute,
    UpdateLeadStatusRoute,
    DeleteLeadRoute,
    SyncAgentCatalogLeadsRoute,
    UploadLeadDocumentRoute,
    SendLeadDocumentWhatsAppRoute,
    GetLeadDocumentRoute,
  ],
  providers: [
    { provide: LeadRepository, useClass: PrismaLeadRepository },
    ListLeadsUseCase,
    GetLeadByIdUseCase,
    CreateLeadUseCase,
    BatchCreateLeadsUseCase,
    UpdateLeadUseCase,
    UpdateLeadStatusUseCase,
    DeleteLeadUseCase,
    SyncAgentCatalogLeadsUseCase,
    GetLeadDocumentUseCase,
    GetPublicLeadDocumentUseCase,
    AckPublicLeadDocumentUseCase,
    SendLeadDocumentWhatsAppUseCase,
    UploadLeadDocumentUseCase,
  ],
  exports: [
    LeadRepository,
    CreateLeadUseCase,
    GetPublicLeadDocumentUseCase,
    AckPublicLeadDocumentUseCase,
  ],
})
export class LeadsModule {}
