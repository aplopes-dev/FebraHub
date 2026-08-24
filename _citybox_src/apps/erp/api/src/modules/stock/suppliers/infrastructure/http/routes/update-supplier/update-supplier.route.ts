import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateSupplierUseCase } from '../../../../application/use-cases/update-supplier/update-supplier.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import {
  toSupplierWritableInput,
  UpdateSupplierHttpDto,
} from '../shared/supplier.dto';
import { SupplierPresenter } from '../shared/supplier.presenter';

@ApiTags('suppliers')
@Controller('v1/suppliers')
export class UpdateSupplierRoute {
  constructor(private readonly updateSupplier: UpdateSupplierUseCase) {}

  @Put(':id')
  @RequirePermission('org.suppliers.manage')
  @ApiOperation({
    summary: 'Atualizar fornecedor',
    description:
      'Semântica de PUT: campo omitido é limpo. Documento e tipo de pessoa são corrigíveis, desde que o documento não seja de outro fornecedor.',
  })
  @ApiResponse({
    status: 404,
    description: 'Fornecedor ou unidade não encontrada',
  })
  @ApiResponse({ status: 409, description: 'Documento de outro fornecedor' })
  @ApiResponse({ status: 422, description: 'CNPJ/CPF inválido' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierHttpDto,
  ) {
    const supplier = await this.updateSupplier.execute({
      organizationId,
      id,
      ...toSupplierWritableInput(dto),
    });

    return SupplierPresenter.toHttpSingle(supplier);
  }
}
