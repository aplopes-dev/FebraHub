import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCardContractUseCase } from '../../../../application/use-cases/create-card-contract/create-card-contract.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateCardContractHttpDto } from '../shared/card-contract.dto';
import { CardContractPresenter } from '../shared/card-contract.presenter';

@ApiTags('card-contracts')
@Controller('v1/card-contracts')
export class CreateCardContractRoute {
  constructor(private readonly createCardContract: CreateCardContractUseCase) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Criar contrato de cartão' })
  @ApiResponse({ status: 201, description: 'Contrato criado' })
  @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateCardContractHttpDto,
  ) {
    const item = await this.createCardContract.execute({
      organizationId,
      ...dto,
    });
    return CardContractPresenter.toHttpSingle(item);
  }
}
