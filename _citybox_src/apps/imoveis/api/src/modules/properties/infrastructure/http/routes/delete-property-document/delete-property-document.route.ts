import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { DeletePropertyDocumentUseCase } from '../../../../application/use-cases/delete-property-document/delete-property-document.use-case';
import { DeletePropertyDocumentPresenter } from './delete-property-document.presenter';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('v1/properties/:propertyId/documents')
export class DeletePropertyDocumentRoute {
  constructor(
    private readonly deletePropertyDocument: DeletePropertyDocumentUseCase,
  ) {}

  @Delete(':documentId')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Property')
  @ApiOperation({ summary: 'Remover documento do imóvel' })
  async handle(
    @StoreId() storeId: string,
    @Param('propertyId') propertyId: string,
    @Param('documentId') documentId: string,
  ) {
    const property = await this.deletePropertyDocument.execute({
      storeId,
      propertyId,
      documentId,
    });
    return DeletePropertyDocumentPresenter.toHttp(property);
  }
}
