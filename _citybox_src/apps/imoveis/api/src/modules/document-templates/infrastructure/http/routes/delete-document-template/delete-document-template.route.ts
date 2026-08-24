import { Controller, Delete, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { DeleteDocumentTemplateUseCase } from '../../../../application/use-cases/delete-document-template/delete-document-template.use-case';

@ApiTags('document-templates')
@ApiBearerAuth()
@Controller('v1/document-templates')
export class DeleteDocumentTemplateRoute {
  constructor(private readonly deleteTemplate: DeleteDocumentTemplateUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission('manage', 'Settings')
  @ApiOperation({ summary: 'Excluir modelo de documento' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteTemplate.execute({ storeId, id });
  }
}
