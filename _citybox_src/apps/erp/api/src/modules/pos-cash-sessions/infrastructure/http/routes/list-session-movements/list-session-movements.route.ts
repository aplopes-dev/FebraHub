import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListSessionMovementsUseCase } from '../../../../application/use-cases/list-session-movements/list-session-movements.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-cash-sessions')
@Controller('v1/pos-cash-sessions')
export class ListSessionMovementsRoute {
  constructor(
    private readonly listSessionMovements: ListSessionMovementsUseCase,
  ) {}

  @Get(':id/movements')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Sangrias e reforços do turno' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') sessionId: string,
  ) {
    const movements = await this.listSessionMovements.execute({
      organizationId,
      sessionId,
    });
    return PosCashSessionPresenter.toHttpMovements(movements);
  }
}
