import { Body, Controller, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { UpdateDocumentTemplateUseCase } from '../../../../application/use-cases/update-document-template/update-document-template.use-case';
import { mapDocumentTemplateToHttp } from '../shared/document-template-response.mapper';
import { UpdateDocumentTemplateDto } from './update-document-template.dto';

@ApiTags('document-templates')
@ApiBearerAuth()
@Controller('v1/document-templates')
export class UpdateDocumentTemplateRoute {
  constructor(private readonly updateTemplate: UpdateDocumentTemplateUseCase) {}

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission('manage', 'Settings')
  @ApiOperation({ summary: 'Atualizar modelo de documento' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentTemplateDto,
  ) {
    const template = await this.updateTemplate.execute({
      storeId,
      id,
      ...dto,
    });
    return { data: mapDocumentTemplateToHttp(template) };
  }
}
