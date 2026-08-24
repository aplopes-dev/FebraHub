import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCashSessionByIdUseCase } from '../../../../application/use-cases/get-cash-session-by-id/get-cash-session-by-id.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { PosCashSessionPresenter } from '../shared/pos-cash-session.presenter';

@ApiTags('pos-cash-sessions')
@Controller('v1/pos-cash-sessions')
export class GetCashSessionByIdRoute {
  constructor(private readonly getCashSessionById: GetCashSessionByIdUseCase) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhe de um turno de caixa' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') sessionId: string,
  ) {
    const session = await this.getCashSessionById.execute({
      organizationId,
      sessionId,
    });
    return PosCashSessionPresenter.toHttpSingle(session);
  }
}
