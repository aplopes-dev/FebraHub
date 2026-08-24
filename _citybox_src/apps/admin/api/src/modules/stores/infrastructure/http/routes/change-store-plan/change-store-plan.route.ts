import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangeStorePlanUseCase } from '../../../../application/use-cases/change-store-plan/change-store-plan.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CurrentUser } from '../../../../../../shared/infra/http/decorators/current-user.decorator';
import {
  formatAuditActor,
  type AuthenticatedUser,
} from '../../../../../../shared/infra/http/auth/authenticated-user';
import { ChangeStorePlanDto } from './change-store-plan.dto';
import { ChangeStorePlanPresenter } from './change-store-plan.presenter';

@ApiTags('stores')
@Controller('v1/stores')
@RequirePermission('platform.admin')
export class ChangeStorePlanRoute {
  constructor(private readonly changeStorePlan: ChangeStorePlanUseCase) {}

  @Patch(':id/plan')
  @ApiOperation({ summary: 'Trocar o plano da loja (mesma vertical)' })
  async handle(
    @Param('id') id: string,
    @Body() dto: ChangeStorePlanDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const store = await this.changeStorePlan.execute({
      id,
      planId: dto.planId,
      billingCycle: dto.billingCycle,
      dueDay: dto.dueDay,
      actor: formatAuditActor(user),
    });
    return ChangeStorePlanPresenter.toHttp(store);
  }
}
