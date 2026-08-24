import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RestoreCardContractUseCase } from '../../../../application/use-cases/restore-card-contract/restore-card-contract.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CardContractPresenter } from '../shared/card-contract.presenter';

@ApiTags('card-contracts')
@Controller('v1/card-contracts')
export class RestoreCardContractRoute {
  constructor(
    private readonly restoreCardContract: RestoreCardContractUseCase,
  ) {}

  @Post(':id/restore')
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Restaurar contrato de cartão excluído',
    description: 'Idempotente: restaurar quem já está ativo devolve 200.',
  })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const item = await this.restoreCardContract.execute({
      organizationId,
      id,
    });
    return CardContractPresenter.toHttpSingle(item);
  }
}
