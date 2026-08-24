import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeleteTemplateUseCase } from '../../../../application/use-cases/delete-template/delete-template.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { StoreId } from '../../../../../../shared/infra/http/decorators/store-id.decorator';

@ApiTags('anamnesis-templates')
@Controller('v1/anamnesis-templates')
@RequirePermission('manage', 'AnamnesisTemplate')
export class DeleteTemplateRoute {
  constructor(private readonly deleteTemplate: DeleteTemplateUseCase) {}

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir modelo de anamnese' })
  async handle(@StoreId() storeId: string, @Param('id') id: string) {
    await this.deleteTemplate.execute({ storeId, id });
  }
}
