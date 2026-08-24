import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DeletePlanUseCase } from '../../../../application/use-cases/delete-plan/delete-plan.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';

@ApiTags('plans')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class DeletePlanRoute {
  constructor(private readonly deletePlan: DeletePlanUseCase) {}

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir plano' })
  async handle(@Param('id') id: string) {
    await this.deletePlan.execute(id);
  }
}
