import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FindTemplateByIdUseCase } from '../../../../application/use-cases/find-template-by-id/find-template-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { TemplatePresenter } from '../shared/template.presenter';

@ApiTags('anamnesis-templates')
@Controller('v1/anamnesis-templates')
@RequirePermission('manage', 'AnamnesisTemplate')
export class FindTemplateByIdRoute {
  constructor(private readonly findTemplateById: FindTemplateByIdUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar modelo de anamnese por ID' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    const template = await this.findTemplateById.execute({ storeId, id });
    return TemplatePresenter.toHttp(template);
  }
}
