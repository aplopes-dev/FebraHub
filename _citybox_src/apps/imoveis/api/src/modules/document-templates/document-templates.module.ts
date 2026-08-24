import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { DealsModule } from '../deals/deals.module';
import { LeadsModule } from '../leads/leads.module';
import { PropertiesModule } from '../properties/properties.module';
import { SettingsModule } from '../settings/settings.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { DocumentTemplateRepository } from './domain/repositories/document-template.repository.interface';
import { GeneratedDocumentRepository } from './domain/repositories/generated-document.repository.interface';
import { DocumentPdfRenderer } from './domain/pdf/document-pdf-renderer';
import { PrismaDocumentTemplateRepository } from './infrastructure/database/prisma-document-template.repository';
import { PrismaGeneratedDocumentRepository } from './infrastructure/database/prisma-generated-document.repository';
import { PdfMakeHtmlRenderer } from './infrastructure/pdf/pdfmake-html-renderer';
import { DocumentMergeContextLoader } from './application/services/document-merge-context.loader';
import { ListDocumentTemplatesUseCase } from './application/use-cases/list-document-templates/list-document-templates.use-case';
import { ListDocumentVariablesUseCase } from './application/use-cases/list-document-variables/list-document-variables.use-case';
import { GetDocumentTemplateByIdUseCase } from './application/use-cases/get-document-template-by-id/get-document-template-by-id.use-case';
import { CreateDocumentTemplateUseCase } from './application/use-cases/create-document-template/create-document-template.use-case';
import { UpdateDocumentTemplateUseCase } from './application/use-cases/update-document-template/update-document-template.use-case';
import { DeleteDocumentTemplateUseCase } from './application/use-cases/delete-document-template/delete-document-template.use-case';
import { SeedDefaultDocumentTemplatesUseCase } from './application/use-cases/seed-default-document-templates/seed-default-document-templates.use-case';
import { PreviewDocumentUseCase } from './application/use-cases/preview-document/preview-document.use-case';
import { GenerateDocumentUseCase } from './application/use-cases/generate-document/generate-document.use-case';
import { GetGeneratedDocumentUseCase } from './application/use-cases/get-generated-document/get-generated-document.use-case';
import { ListDocumentTemplatesRoute } from './infrastructure/http/routes/list-document-templates/list-document-templates.route';
import { ListDocumentVariablesRoute } from './infrastructure/http/routes/list-document-variables/list-document-variables.route';
import { SeedDefaultDocumentTemplatesRoute } from './infrastructure/http/routes/seed-default-document-templates/seed-default-document-templates.route';
import { CreateDocumentTemplateRoute } from './infrastructure/http/routes/create-document-template/create-document-template.route';
import { GetDocumentTemplateByIdRoute } from './infrastructure/http/routes/get-document-template-by-id/get-document-template-by-id.route';
import { UpdateDocumentTemplateRoute } from './infrastructure/http/routes/update-document-template/update-document-template.route';
import { DeleteDocumentTemplateRoute } from './infrastructure/http/routes/delete-document-template/delete-document-template.route';
import { PreviewDocumentRoute } from './infrastructure/http/routes/preview-document/preview-document.route';
import { GenerateDocumentRoute } from './infrastructure/http/routes/generate-document/generate-document.route';
import { GetGeneratedDocumentRoute } from './infrastructure/http/routes/get-generated-document/get-generated-document.route';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => LeadsModule),
    PropertiesModule,
    AppointmentsModule,
    forwardRef(() => TransactionsModule),
    SettingsModule,
    forwardRef(() => DealsModule),
  ],
  controllers: [
    ListDocumentVariablesRoute,
    SeedDefaultDocumentTemplatesRoute,
    ListDocumentTemplatesRoute,
    CreateDocumentTemplateRoute,
    GetDocumentTemplateByIdRoute,
    UpdateDocumentTemplateRoute,
    DeleteDocumentTemplateRoute,
    PreviewDocumentRoute,
    GenerateDocumentRoute,
    GetGeneratedDocumentRoute,
  ],
  providers: [
    {
      provide: DocumentTemplateRepository,
      useClass: PrismaDocumentTemplateRepository,
    },
    {
      provide: GeneratedDocumentRepository,
      useClass: PrismaGeneratedDocumentRepository,
    },
    { provide: DocumentPdfRenderer, useClass: PdfMakeHtmlRenderer },
    DocumentMergeContextLoader,
    ListDocumentTemplatesUseCase,
    ListDocumentVariablesUseCase,
    GetDocumentTemplateByIdUseCase,
    CreateDocumentTemplateUseCase,
    UpdateDocumentTemplateUseCase,
    DeleteDocumentTemplateUseCase,
    SeedDefaultDocumentTemplatesUseCase,
    PreviewDocumentUseCase,
    GenerateDocumentUseCase,
    GetGeneratedDocumentUseCase,
  ],
})
export class DocumentTemplatesModule {}
