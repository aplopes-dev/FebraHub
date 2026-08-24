import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateTemplateUseCase } from '../../../../application/use-cases/update-template/update-template.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { TemplateBodyDto } from '../shared/template-body.dto';
import { TemplatePresenter } from '../shared/template.presenter';

@ApiTags('anamnesis-templates')
@Controller('v1/anamnesis-templates')
@RequirePermission('manage', 'AnamnesisTemplate')
export class UpdateTemplateRoute {
  constructor(private readonly updateTemplate: UpdateTemplateUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar modelo de anamnese' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: TemplateBodyDto,
  ) {
    const template = await this.updateTemplate.execute({ storeId, id, ...dto });
    return TemplatePresenter.toHttp(template);
  }
}
