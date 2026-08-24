import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateCarrierUseCase } from '../../../../application/use-cases/update-carrier/update-carrier.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  toCarrierWritableInput,
  UpdateCarrierHttpDto,
} from '../shared/carrier.dto';
import { CarrierPresenter } from '../shared/carrier.presenter';

@ApiTags('carriers')
@Controller('v1/carriers')
export class UpdateCarrierRoute {
  constructor(private readonly updateCarrier: UpdateCarrierUseCase) {}

  @Put(':id')
  @RequirePermission('store.stock.manage')
  @ApiOperation({
    summary: 'Atualizar transportadora',
    description:
      'Semântica de PUT: campo omitido é limpo. Documento e tipo de pessoa são corrigíveis, desde que o documento não seja de outra transportadora.',
  })
  @ApiResponse({
    status: 404,
    description: 'Transportadora ou unidade não encontrada',
  })
  @ApiResponse({
    status: 409,
    description: 'Documento de outra transportadora',
  })
  @ApiResponse({ status: 422, description: 'CNPJ/CPF inválido' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarrierHttpDto,
  ) {
    const carrier = await this.updateCarrier.execute({
      organizationId,
      id,
      ...toCarrierWritableInput(dto),
    });

    return CarrierPresenter.toHttpSingle(carrier);
  }
}
