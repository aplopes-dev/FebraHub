import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { GetDocumentTemplateByIdUseCase } from '../../../../application/use-cases/get-document-template-by-id/get-document-template-by-id.use-case';
import { mapDocumentTemplateToHttp } from '../shared/document-template-response.mapper';

@ApiTags('document-templates')
@ApiBearerAuth()
@Controller('v1/document-templates')
export class GetDocumentTemplateByIdRoute {
  constructor(private readonly getTemplate: GetDocumentTemplateByIdUseCase) {}

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('read', 'Settings')
  @ApiOperation({ summary: 'Obter modelo de documento' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const template = await this.getTemplate.execute({ storeId, id });
    return { data: mapDocumentTemplateToHttp(template) };
  }
}
