import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTemplateUseCase } from '../../../../application/use-cases/create-template/create-template.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';
import { TemplateBodyDto } from '../shared/template-body.dto';
import { TemplatePresenter } from '../shared/template.presenter';

@ApiTags('anamnesis-templates')
@Controller('v1/anamnesis-templates')
@RequirePermission('manage', 'AnamnesisTemplate')
export class CreateTemplateRoute {
  constructor(private readonly createTemplate: CreateTemplateUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar modelo de anamnese' })
  async handle(@StoreId() storeId: string, @Body() dto: TemplateBodyDto) {
    const template = await this.createTemplate.execute({ storeId, ...dto });
    return TemplatePresenter.toHttp(template);
  }
}
