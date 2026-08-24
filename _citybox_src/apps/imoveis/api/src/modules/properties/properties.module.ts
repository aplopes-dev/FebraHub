import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { PropertyRepository } from './domain/repositories/property.repository.interface';
import { PrismaPropertyRepository } from './infrastructure/database/prisma-property.repository';
import { ListPropertiesRoute } from './infrastructure/http/routes/list-properties/list-properties.route';
import { GetPropertyByIdRoute } from './infrastructure/http/routes/get-property-by-id/get-property-by-id.route';
import { CreatePropertyRoute } from './infrastructure/http/routes/create-property/create-property.route';
import { UpdatePropertyRoute } from './infrastructure/http/routes/update-property/update-property.route';
import { DeletePropertyRoute } from './infrastructure/http/routes/delete-property/delete-property.route';
import { SyncAgentCatalogPropertiesRoute } from './infrastructure/http/routes/sync-agent-catalog-properties/sync-agent-catalog-properties.route';
import { UploadPropertyPhotoRoute } from './infrastructure/http/routes/upload-property-photo/upload-property-photo.route';
import { GetPropertyPhotoRoute } from './infrastructure/http/routes/get-property-photo/get-property-photo.route';
import { DeletePropertyPhotoRoute } from './infrastructure/http/routes/delete-property-photo/delete-property-photo.route';
import { ReorderPropertyPhotosRoute } from './infrastructure/http/routes/reorder-property-photos/reorder-property-photos.route';
import { UploadPropertyDocumentRoute } from './infrastructure/http/routes/upload-property-document/upload-property-document.route';
import { GetPropertyDocumentRoute } from './infrastructure/http/routes/get-property-document/get-property-document.route';
import { DeletePropertyDocumentRoute } from './infrastructure/http/routes/delete-property-document/delete-property-document.route';
import { ListPropertiesUseCase } from './application/use-cases/list-properties/list-properties.use-case';
import { GetPropertyByIdUseCase } from './application/use-cases/get-property-by-id/get-property-by-id.use-case';
import { CreatePropertyUseCase } from './application/use-cases/create-property/create-property.use-case';
import { UpdatePropertyUseCase } from './application/use-cases/update-property/update-property.use-case';
import { DeletePropertyUseCase } from './application/use-cases/delete-property/delete-property.use-case';
import { SyncAgentCatalogPropertiesUseCase } from './application/use-cases/sync-agent-catalog-properties/sync-agent-catalog-properties.use-case';
import { UploadPropertyPhotoUseCase } from './application/use-cases/upload-property-photo/upload-property-photo.use-case';
import { GetPropertyPhotoUseCase } from './application/use-cases/get-property-photo/get-property-photo.use-case';
import { DeletePropertyPhotoUseCase } from './application/use-cases/delete-property-photo/delete-property-photo.use-case';
import { ReorderPropertyPhotosUseCase } from './application/use-cases/reorder-property-photos/reorder-property-photos.use-case';
import { UploadPropertyDocumentUseCase } from './application/use-cases/upload-property-document/upload-property-document.use-case';
import { GetPropertyDocumentUseCase } from './application/use-cases/get-property-document/get-property-document.use-case';
import { DeletePropertyDocumentUseCase } from './application/use-cases/delete-property-document/delete-property-document.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [
    ListPropertiesRoute,
    GetPropertyByIdRoute,
    CreatePropertyRoute,
    UpdatePropertyRoute,
    DeletePropertyRoute,
    SyncAgentCatalogPropertiesRoute,
    UploadPropertyPhotoRoute,
    GetPropertyPhotoRoute,
    DeletePropertyPhotoRoute,
    ReorderPropertyPhotosRoute,
    UploadPropertyDocumentRoute,
    GetPropertyDocumentRoute,
    DeletePropertyDocumentRoute,
  ],
  providers: [
    { provide: PropertyRepository, useClass: PrismaPropertyRepository },
    ListPropertiesUseCase,
    GetPropertyByIdUseCase,
    CreatePropertyUseCase,
    UpdatePropertyUseCase,
    DeletePropertyUseCase,
    SyncAgentCatalogPropertiesUseCase,
    UploadPropertyPhotoUseCase,
    GetPropertyPhotoUseCase,
    DeletePropertyPhotoUseCase,
    ReorderPropertyPhotosUseCase,
    UploadPropertyDocumentUseCase,
    GetPropertyDocumentUseCase,
    DeletePropertyDocumentUseCase,
  ],
  exports: [PropertyRepository],
})
export class PropertiesModule {}
