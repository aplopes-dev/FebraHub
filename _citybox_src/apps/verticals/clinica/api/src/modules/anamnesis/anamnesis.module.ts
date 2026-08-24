import { Module } from '@nestjs/common';
import {
  AnamnesisQuestionRepository,
  AnamnesisTemplateRepository,
} from './domain/repositories/anamnesis.repository.interface';
import {
  PrismaAnamnesisQuestionRepository,
  PrismaAnamnesisTemplateRepository,
} from './infrastructure/database/prisma-anamnesis.repository';
import { ListTemplatesRoute } from './infrastructure/http/routes/list-templates/list-templates.route';
import { FindTemplateByIdRoute } from './infrastructure/http/routes/find-template-by-id/find-template-by-id.route';
import { CreateTemplateRoute } from './infrastructure/http/routes/create-template/create-template.route';
import { UpdateTemplateRoute } from './infrastructure/http/routes/update-template/update-template.route';
import { UpdateTemplateStatusRoute } from './infrastructure/http/routes/update-template-status/update-template-status.route';
import { DeleteTemplateRoute } from './infrastructure/http/routes/delete-template/delete-template.route';
import { ListQuestionsRoute } from './infrastructure/http/routes/list-questions/list-questions.route';
import { ListTemplatesUseCase } from './application/use-cases/list-templates/list-templates.use-case';
import { FindTemplateByIdUseCase } from './application/use-cases/find-template-by-id/find-template-by-id.use-case';
import { CreateTemplateUseCase } from './application/use-cases/create-template/create-template.use-case';
import { UpdateTemplateUseCase } from './application/use-cases/update-template/update-template.use-case';
import { UpdateTemplateStatusUseCase } from './application/use-cases/update-template-status/update-template-status.use-case';
import { DeleteTemplateUseCase } from './application/use-cases/delete-template/delete-template.use-case';
import { ListQuestionsUseCase } from './application/use-cases/list-questions/list-questions.use-case';

@Module({
  controllers: [
    ListTemplatesRoute,
    FindTemplateByIdRoute,
    CreateTemplateRoute,
    UpdateTemplateRoute,
    UpdateTemplateStatusRoute,
    DeleteTemplateRoute,
    ListQuestionsRoute,
  ],
  providers: [
    {
      provide: AnamnesisTemplateRepository,
      useClass: PrismaAnamnesisTemplateRepository,
    },
    {
      provide: AnamnesisQuestionRepository,
      useClass: PrismaAnamnesisQuestionRepository,
    },
    ListTemplatesUseCase,
    FindTemplateByIdUseCase,
    CreateTemplateUseCase,
    UpdateTemplateUseCase,
    UpdateTemplateStatusUseCase,
    DeleteTemplateUseCase,
    ListQuestionsUseCase,
  ],
  exports: [
    AnamnesisTemplateRepository,
    AnamnesisQuestionRepository,
    FindTemplateByIdUseCase,
    ListQuestionsUseCase,
  ],
})
export class AnamnesisModule {}
