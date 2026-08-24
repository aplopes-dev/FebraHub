import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateTemplateStatusUseCase } from '../../../../application/use-cases/update-template-status/update-template-status.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { UpdateTemplateStatusBodyDto } from '../shared/template-body.dto';
import { TemplatePresenter } from '../shared/template.presenter';

@ApiTags('anamnesis-templates')
@Controller('v1/anamnesis-templates')
@RequirePermission('manage', 'AnamnesisTemplate')
export class UpdateTemplateStatusRoute {
  constructor(
    private readonly updateTemplateStatus: UpdateTemplateStatusUseCase,
  ) {}

  @Patch(':id/status')
  @ApiOperation({ summary: 'Ativar/desativar modelo de anamnese' })
  async handle(
    @StoreId() storeId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateStatusBodyDto,
  ) {
    const template = await this.updateTemplateStatus.execute({
      storeId,
      id,
      status: dto.status,
    });
    return TemplatePresenter.toHttp(template);
  }
}
