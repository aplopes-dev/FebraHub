import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCarrierUseCase } from '../../../../application/use-cases/create-carrier/create-carrier.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  CreateCarrierHttpDto,
  toCarrierWritableInput,
} from '../shared/carrier.dto';
import { CarrierPresenter } from '../shared/carrier.presenter';

@ApiTags('carriers')
@Controller('v1/carriers')
export class CreateCarrierRoute {
  constructor(private readonly createCarrier: CreateCarrierUseCase) {}

  @Post()
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Cadastrar transportadora',
    description:
      'Cria uma transportadora na organização ativa. O documento é único na organização e as unidades informadas precisam pertencer a ela.',
  })
  @ApiResponse({ status: 201, description: 'Transportadora criada' })
  @ApiResponse({ status: 404, description: 'Unidade informada não existe' })
  @ApiResponse({ status: 409, description: 'Documento já cadastrado' })
  @ApiResponse({ status: 422, description: 'CNPJ/CPF inválido' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateCarrierHttpDto,
  ) {
    const carrier = await this.createCarrier.execute({
      organizationId,
      ...toCarrierWritableInput(dto),
    });

    return CarrierPresenter.toHttpSingle(carrier);
  }
}
