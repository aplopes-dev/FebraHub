import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListTemplatesUseCase } from '../../../../application/use-cases/list-templates/list-templates.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { TemplateListPresenter } from '../shared/template.presenter';

@ApiTags('anamnesis-templates')
@Controller('v1/anamnesis-templates')
@RequirePermission('manage', 'AnamnesisTemplate')
export class ListTemplatesRoute {
  constructor(private readonly listTemplates: ListTemplatesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar modelos de anamnese' })
  async handle(@StoreId() storeId: string) {
    const templates = await this.listTemplates.execute({ storeId });
    return TemplateListPresenter.toHttp(templates);
  }
}
