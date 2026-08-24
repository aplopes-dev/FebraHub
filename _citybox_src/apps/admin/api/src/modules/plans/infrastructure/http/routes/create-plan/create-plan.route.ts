import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePlanUseCase } from '../../../../application/use-cases/create-plan/create-plan.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CreatePlanBodyDto } from './create-plan.dto';
import { CreatePlanPresenter } from './create-plan.presenter';

@ApiTags('plans')
@Controller('v1/platform/billing')
@RequirePermission('platform.admin')
export class CreatePlanRoute {
  constructor(private readonly createPlan: CreatePlanUseCase) {}

  @Post('plans')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar plano' })
  async handle(@Body() dto: CreatePlanBodyDto) {
    const plan = await this.createPlan.execute(dto);
    return CreatePlanPresenter.toHttp(plan);
  }
}
